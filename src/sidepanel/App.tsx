import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, createShare, errorMessage, generateCircle } from '../lib/api';
import { SITE_LINKS, SITE_URL } from '../lib/config';
import { sampleCircle } from '../lib/demo';
import { parseHandle } from '../lib/handle';
import {
  canvasToBlob,
  circleThemes,
  renderCircle,
  type CircleDrawSettings,
} from '../lib/render';
import type { CircleCount, CircleResult, CircleTheme } from '../lib/types';
import { t, type Locale } from './i18n';

const THEMES: CircleTheme[] = ['mint', 'midnight', 'peach', 'paper'];
const COUNTS: CircleCount[] = [8, 24, 50];

function openExternal(url: string) {
  chrome.runtime.sendMessage({ type: 'xcircle:open-site', url }).catch(() => {
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#f4efff" />
      <g transform="translate(6 6) scale(.8125)">
        <circle cx="25" cy="25" r="23" fill="#eae1fc" />
        <circle cx="25" cy="19" r="6.4" fill="#f6bfa1" />
        <path d="M12 41a13 13 0 0 1 26 0Z" fill="#7651c9" />
        <circle
          cx="48"
          cy="46"
          r="14"
          fill="#f18b6d"
          stroke="#faf9f6"
          strokeWidth="3"
        />
        <circle cx="48" cy="42.5" r="3.7" fill="#fff5e7" />
        <path d="M40.5 54a7.5 7.5 0 0 1 15 0Z" fill="#fff5e7" />
      </g>
    </svg>
  );
}

export function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const copy = t(locale);
  const [handleInput, setHandleInput] = useState('');
  const [result, setResult] = useState<CircleResult | null>(null);
  const [theme, setTheme] = useState<CircleTheme>('mint');
  const [count, setCount] = useState<CircleCount>(24);
  const [showNames, setShowNames] = useState(false);
  const [showRanks, setShowRanks] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const circle = result ?? sampleCircle;
  const isSample = !result;
  const settings = useMemo<CircleDrawSettings>(
    () => ({ theme, count, showNames, showRanks, hidden }),
    [theme, count, showNames, showRanks, hidden]
  );

  const drawCopy = useMemo(
    () => ({
      title: 'X Circle',
      subtitle: 'Who you talk with most',
      brand: 'xcircle.me',
      sample: locale === 'zh' ? '示例预览' : 'Sample preview',
      you: locale === 'zh' ? '你' : 'You',
    }),
    [locale]
  );

  const displayPeople = circle.people
    .filter((p) => !hidden.includes(p.handle.toLowerCase()))
    .slice(0, count);

  useEffect(() => {
    chrome.storage.local.get(['locale']).then((data) => {
      if (data.locale === 'zh' || data.locale === 'en') setLocale(data.locale);
    });
    chrome.storage.session
      .get(['pendingHandle', 'lastPageHandle'])
      .then((data) => {
        const pending = parseHandle(String(data.pendingHandle || ''));
        const last = parseHandle(String(data.lastPageHandle || ''));
        if (pending) {
          setHandleInput(pending);
          chrome.storage.session.remove('pendingHandle');
        } else if (last) {
          setHandleInput(last);
        } else {
          chrome.runtime.sendMessage(
            { type: 'xcircle:get-tab-handle' },
            (response) => {
              if (response?.handle) setHandleInput(response.handle);
            }
          );
        }
      });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controller = new AbortController();
    renderCircle(canvas, circle, settings, drawCopy, controller.signal).catch(
      () => {}
    );
    return () => controller.abort();
  }, [circle, settings, drawCopy]);

  useEffect(() => {
    if (!busy) {
      setWaitSeconds(0);
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(
      () => setWaitSeconds(Math.floor((Date.now() - started) / 1000)),
      250
    );
    return () => window.clearInterval(timer);
  }, [busy]);

  async function onGenerate(refresh = false) {
    const handle = parseHandle(handleInput);
    if (!handle) {
      setError(errorMessage(new ApiError(-1, 'invalid_handle'), locale));
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError('');
    setShareUrl('');
    setShareFeedback('');
    try {
      const data = await generateCircle(handle, {
        refresh,
        signal: controller.signal,
      });
      setResult(data);
      setHidden([]);
      setHandleInput(data.owner.handle);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(errorMessage(err, locale));
    } finally {
      setBusy(false);
    }
  }

  async function useCurrentTab() {
    chrome.runtime.sendMessage(
      { type: 'xcircle:get-tab-handle' },
      (response) => {
        if (response?.handle) {
          setHandleInput(response.handle);
        } else {
          setError(
            locale === 'zh'
              ? '当前标签页不是 X 个人主页。'
              : 'Current tab is not an X profile page.'
          );
        }
      }
    );
  }

  async function onDownload() {
    const canvas = canvasRef.current;
    if (!canvas || isSample) return;
    setExporting(true);
    try {
      await renderCircle(canvas, circle, settings, drawCopy);
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${circle.owner.handle}-xcircle.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function onShare() {
    if (isSample) return;
    try {
      const share = await createShare({
        circleHandle: circle.owner.handle,
        theme,
        count,
        showNames,
        showRanks,
        hidden,
        expectedFetchedAt: circle.fetchedAt,
      });
      const url = share.url.startsWith('http')
        ? share.url
        : SITE_LINKS.share(share.id);
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setShareFeedback(copy.shared);
      window.setTimeout(() => setShareFeedback(''), 2000);
    } catch (err) {
      setError(errorMessage(err, locale));
    }
  }

  function toggleHidden(handle: string) {
    const key = handle.toLowerCase();
    setHidden((prev) =>
      prev.includes(key) ? prev.filter((h) => h !== key) : [...prev, key]
    );
    setShareUrl('');
  }

  function switchLocale() {
    const next = locale === 'en' ? 'zh' : 'en';
    setLocale(next);
    chrome.storage.local.set({ locale: next });
  }

  return (
    <div className="app">
      <header className="header">
        <a
          className="brand"
          href={SITE_URL}
          onClick={(e) => {
            e.preventDefault();
            openExternal(SITE_URL);
          }}
        >
          <BrandMark />
          <span>
            {copy.brand}
            <small>{copy.tagline}</small>
          </span>
        </a>
        <div className="header-actions">
          <button type="button" className="ghost" onClick={switchLocale}>
            {locale === 'en' ? '中文' : 'EN'}
          </button>
          <button
            type="button"
            className="ghost accent"
            onClick={() => openExternal(SITE_URL)}
          >
            {copy.openSite} ↗
          </button>
        </div>
      </header>

      <section className="card form-card">
        <label className="field">
          <span>{copy.handleLabel}</span>
          <input
            value={handleInput}
            onChange={(e) => setHandleInput(e.target.value)}
            placeholder={copy.handlePlaceholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onGenerate(false);
            }}
            disabled={busy}
          />
        </label>
        <div className="row">
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={() => onGenerate(false)}
          >
            {busy ? copy.regenerating : copy.generate}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={useCurrentTab}
          >
            {copy.useTab}
          </button>
        </div>
        {busy && waitSeconds > 2 ? (
          <p className="hint">{copy.wait.replace('{s}', String(waitSeconds))}</p>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="card preview-card">
        {isSample ? <p className="hint sample">{copy.sampleHint}</p> : null}
        <div className="canvas-wrap" style={{ background: circleThemes[theme].background }}>
          <canvas ref={canvasRef} width={1200} height={1200} />
        </div>
        {!isSample ? (
          <p className="hint">
            {copy.coverage
              .replace('{posts}', String(circle.coverage.posts))
              .replace(
                '{when}',
                new Date(circle.fetchedAt).toLocaleString(
                  locale === 'zh' ? 'zh-CN' : 'en-US'
                )
              )}
          </p>
        ) : null}

        <div className="controls">
          <div className="control">
            <span>{copy.theme}</span>
            <div className="chips">
              {THEMES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={item === theme ? 'chip on' : 'chip'}
                  style={{ background: circleThemes[item].background }}
                  onClick={() => setTheme(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="control">
            <span>{copy.people}</span>
            <div className="chips">
              {COUNTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={item === count ? 'chip on' : 'chip'}
                  onClick={() => setCount(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="toggles">
            <label>
              <input
                type="checkbox"
                checked={showNames}
                onChange={(e) => setShowNames(e.target.checked)}
              />
              {copy.showNames}
            </label>
            <label>
              <input
                type="checkbox"
                checked={showRanks}
                onChange={(e) => setShowRanks(e.target.checked)}
              />
              {copy.showRanks}
            </label>
          </div>
        </div>

        <div className="row">
          <button
            type="button"
            className="primary"
            disabled={isSample || exporting}
            onClick={onDownload}
          >
            {copy.download}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={isSample}
            onClick={onShare}
          >
            {shareFeedback || copy.share}
          </button>
          {!isSample ? (
            <button
              type="button"
              className="ghost"
              disabled={busy}
              onClick={() => onGenerate(true)}
            >
              {copy.refresh}
            </button>
          ) : null}
        </div>
        {shareUrl ? (
          <a
            className="share-link"
            href={shareUrl}
            onClick={(e) => {
              e.preventDefault();
              openExternal(shareUrl);
            }}
          >
            {shareUrl}
          </a>
        ) : null}
      </section>

      {!isSample ? (
        <section className="card">
          <h2>{copy.peopleList}</h2>
          <ul className="people">
            {circle.people.slice(0, Math.max(count, 24)).map((person, index) => {
              const isHidden = hidden.includes(person.handle.toLowerCase());
              return (
                <li key={person.id} className={isHidden ? 'hidden' : ''}>
                  <span className="rank">{index + 1}</span>
                  <div>
                    <strong>@{person.handle}</strong>
                    <small>
                      {person.name} · {person.score.toFixed(1)}
                    </small>
                  </div>
                  <button type="button" onClick={() => toggleHidden(person.handle)}>
                    {isHidden ? copy.show : copy.hide}
                  </button>
                </li>
              );
            })}
          </ul>
          {displayPeople.length === 0 ? (
            <p className="hint">{copy.emptyHidden}</p>
          ) : null}
        </section>
      ) : null}

      <section className="card links-card">
        <button
          type="button"
          className="site-cta"
          onClick={() =>
            openExternal(SITE_LINKS.openStudio(result?.owner.handle))
          }
        >
          {copy.fullStudio} ↗
        </button>
        <nav className="site-links" aria-label="XCircle website">
          <button type="button" onClick={() => openExternal(SITE_LINKS.howItWorks)}>
            {copy.howItWorks}
          </button>
          <button type="button" onClick={() => openExternal(SITE_LINKS.guides)}>
            {copy.guide}
          </button>
          <button type="button" onClick={() => openExternal(SITE_LINKS.recap)}>
            {copy.recap}
          </button>
          <button type="button" onClick={() => openExternal(SITE_LINKS.mosaic)}>
            {copy.mosaic}
          </button>
          <button type="button" onClick={() => openExternal(SITE_LINKS.privacy)}>
            {copy.privacy}
          </button>
        </nav>
        <p className="powered">
          <a
            href={SITE_URL}
            onClick={(e) => {
              e.preventDefault();
              openExternal(SITE_URL);
            }}
          >
            {copy.powered}
          </a>
        </p>
      </section>
    </div>
  );
}
