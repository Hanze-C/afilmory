/**
 * 背景装饰层
 * 提供径向渐变、网格和光线效果
 */

export const BackgroundDecor = () => (
  <>
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(0,122,255,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(156,39,176,0.25), transparent 40%), radial-gradient(circle at 50% 80%, rgba(0,150,136,0.25), transparent 45%)',
      }}
    />
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05)_0%,transparent_35%,rgba(255,255,255,0.05)_70%)] opacity-40" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:120px_120px]" />
  </>
)
