import { useTranslation } from 'react-i18next'

export default function SplashScreen({
  customMessage,
}: {
  customMessage?: string
}) {
  const { t } = useTranslation('common')

  return (
    <>
      <style>
        {`
          .splash-shell {
            position: relative;
            overflow: hidden;
            isolation: isolate;
            min-height: 100vh;
            min-height: 100svh;
            padding-top: max(1rem, env(safe-area-inset-top));
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
            padding-left: max(1rem, env(safe-area-inset-left));
            padding-right: max(1rem, env(safe-area-inset-right));
            background:
              radial-gradient(circle at 20% 20%, rgba(236, 72, 153, 0.12), transparent 35%),
              radial-gradient(circle at 80% 15%, rgba(59, 130, 246, 0.1), transparent 40%),
              linear-gradient(165deg, #ffffff, #f8fafc 50%, #f1f5f9);
          }

          .splash-orb {
            position: absolute;
            width: clamp(140px, 28vw, 320px);
            aspect-ratio: 1 / 1;
            border-radius: 999px;
            filter: blur(36px);
            opacity: 0.45;
            pointer-events: none;
            animation: splash-float 8s ease-in-out infinite;
            will-change: transform;
            transform: translate3d(0, 0, 0);
          }

          .splash-orb-left {
            left: -10%;
            top: 6%;
            background: rgba(244, 114, 182, 0.5);
          }

          .splash-orb-right {
            right: -12%;
            bottom: 8%;
            background: rgba(14, 165, 233, 0.42);
            animation-delay: -3s;
          }

          .splash-brand {
            position: relative;
            font-size: clamp(2.5rem, 8vw, 4.5rem);
            line-height: 1.05;
            color: transparent;
            background-image: linear-gradient(110deg, #334155 15%, #0f172a 45%, #64748b 60%, #0f172a 75%);
            background-size: 240% auto;
            -webkit-background-clip: text;
            background-clip: text;
            animation: splash-shimmer 3.2s linear infinite;
            will-change: background-position;
          }

          .splash-tagline {
            max-width: 34rem;
            margin-inline: auto;
            font-size: clamp(1.1rem, 4.8vw, 1.9rem);
            line-height: 1.25;
            animation: splash-fade-up 500ms ease-out both;
            animation-delay: 120ms;
          }

          .splash-underline-path {
            stroke-dasharray: 420;
            stroke-dashoffset: 420;
            animation: splash-draw 2.4s ease-in-out infinite;
            will-change: stroke-dashoffset;
          }

          .splash-loading {
            font-size: clamp(0.85rem, 2.9vw, 1rem);
            animation: splash-fade-up 500ms ease-out both;
            animation-delay: 180ms;
          }

          .splash-dot {
            display: inline-block;
            width: 0.5rem;
            height: 0.5rem;
            border-radius: 999px;
            background: rgb(71 85 105 / 0.85);
            animation: splash-pulse 1s ease-in-out infinite;
            will-change: transform, opacity;
          }

          .splash-dot:nth-child(2) { animation-delay: 0.15s; }
          .splash-dot:nth-child(3) { animation-delay: 0.3s; }

          @media (max-width: 480px) {
            .splash-shell {
              justify-content: center;
            }

            .splash-orb {
              width: clamp(110px, 24vw, 180px);
              filter: blur(28px);
              opacity: 0.35;
            }

            .splash-orb-left {
              left: -16%;
              top: 2%;
            }

            .splash-orb-right {
              right: -18%;
              bottom: 4%;
            }
          }

          @keyframes splash-float {
            0%, 100% { transform: translate3d(0, 0, 0); }
            50% { transform: translate3d(0, -14px, 0); }
          }

          @keyframes splash-shimmer {
            to { background-position: 200% center; }
          }

          @keyframes splash-draw {
            0% { stroke-dashoffset: 420; opacity: 0.4; }
            35% { stroke-dashoffset: 0; opacity: 0.9; }
            65% { stroke-dashoffset: 0; opacity: 0.95; }
            100% { stroke-dashoffset: -420; opacity: 0.5; }
          }

          @keyframes splash-pulse {
            0%, 100% { transform: translateY(0); opacity: 0.35; }
            50% { transform: translateY(-3px); opacity: 1; }
          }

          @keyframes splash-fade-up {
            from { transform: translateY(6px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          @media (prefers-reduced-motion: reduce) {
            .splash-orb,
            .splash-brand,
            .splash-underline-path,
            .splash-dot,
            .splash-tagline,
            .splash-loading {
              animation: none !important;
            }
          }
        `}
      </style>
      <div className="splash-shell w-screen flex flex-col items-center justify-center gap-y-3 sm:gap-y-4 px-4 sm:px-6">
        <div className="splash-orb splash-orb-left" />
        <div className="splash-orb splash-orb-right" />

        <h1 className="splash-brand w-full text-center font-poppins font-semibold tracking-wide">
          {t('platform_name')}
        </h1>

        <svg
          aria-hidden="true"
          className="w-[min(78vw,320px)] h-4"
          viewBox="0 0 320 16"
        >
          <path
            className="splash-underline-path"
            d="M4 8 C 44 2, 84 14, 124 8 S 204 2, 244 8 S 284 14, 316 8"
            fill="none"
            stroke="rgb(71 85 105 / 0.85)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        <h2 className="splash-tagline w-full text-center font-poppins text-gray-500 px-1">
          {customMessage || t('routes.splash.subtitle')}
        </h2>

        <div className="splash-loading mt-2 flex items-center gap-x-3 font-poppins tracking-wide text-slate-600">
          <span>{t('routes.splash.loading_label')}</span>
          <span className="flex items-center gap-x-1.5" aria-hidden="true">
            <span className="splash-dot" />
            <span className="splash-dot" />
            <span className="splash-dot" />
          </span>
        </div>
      </div>
    </>
  )
}
