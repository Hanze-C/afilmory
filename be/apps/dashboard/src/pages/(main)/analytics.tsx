import { MainPageLayout } from '~/components/layouts/MainPageLayout'

export const Component = () => {
  return (
    <MainPageLayout
      title="Analytics"
      description="Track your photo collection statistics and trends"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upload Trends */}
        <div className="bg-background-tertiary relative p-5">
          <div className="via-text/20 absolute top-0 right-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
          <div className="via-text/20 absolute top-0 right-0 bottom-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />
          <div className="via-text/20 absolute right-0 bottom-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
          <div className="via-text/20 absolute top-0 bottom-0 left-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />

          <h2 className="text-text mb-4 text-sm font-semibold">
            Upload Trends
          </h2>
          <div className="text-text-tertiary flex h-64 items-center justify-center text-[13px]">
            Chart placeholder
          </div>
        </div>

        {/* Storage Usage */}
        <div className="bg-background-tertiary relative p-5">
          <div className="via-text/20 absolute top-0 right-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
          <div className="via-text/20 absolute top-0 right-0 bottom-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />
          <div className="via-text/20 absolute right-0 bottom-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
          <div className="via-text/20 absolute top-0 bottom-0 left-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />

          <h2 className="text-text mb-4 text-sm font-semibold">
            Storage Usage
          </h2>
          <div className="text-text-tertiary flex h-64 items-center justify-center text-[13px]">
            Chart placeholder
          </div>
        </div>

        {/* Popular Tags */}
        <div className="bg-background-tertiary relative p-5">
          <div className="via-text/20 absolute top-0 right-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
          <div className="via-text/20 absolute top-0 right-0 bottom-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />
          <div className="via-text/20 absolute right-0 bottom-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
          <div className="via-text/20 absolute top-0 bottom-0 left-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />

          <h2 className="text-text mb-4 text-sm font-semibold">Popular Tags</h2>
          <div className="space-y-1.5">
            {[
              { tag: 'Nature', count: 234 },
              { tag: 'Travel', count: 189 },
              { tag: 'Portrait', count: 156 },
              { tag: 'Architecture', count: 142 },
            ].map((item) => (
              <div
                key={item.tag}
                className="bg-fill/10 hover:bg-fill/20 flex items-center justify-between px-3 py-2 transition-colors"
              >
                <span className="text-text text-[13px]">{item.tag}</span>
                <span className="text-accent text-[13px] font-medium">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Device Stats */}
        <div className="bg-background-tertiary relative p-5">
          <div className="via-text/20 absolute top-0 right-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
          <div className="via-text/20 absolute top-0 right-0 bottom-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />
          <div className="via-text/20 absolute right-0 bottom-0 left-0 h-[0.5px] bg-gradient-to-r from-transparent to-transparent" />
          <div className="via-text/20 absolute top-0 bottom-0 left-0 w-[0.5px] bg-gradient-to-b from-transparent to-transparent" />

          <h2 className="text-text mb-4 text-sm font-semibold">Top Devices</h2>
          <div className="space-y-1.5">
            {[
              { device: 'iPhone 15 Pro', count: 456 },
              { device: 'Canon EOS R5', count: 342 },
              { device: 'Sony A7 IV', count: 287 },
              { device: 'Fujifilm X-T5', count: 149 },
            ].map((item) => (
              <div
                key={item.device}
                className="bg-fill/10 hover:bg-fill/20 flex items-center justify-between px-3 py-2 transition-colors"
              >
                <span className="text-text text-[13px]">{item.device}</span>
                <span className="text-accent text-[13px] font-medium">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainPageLayout>
  )
}
