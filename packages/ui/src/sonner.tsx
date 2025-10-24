import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      gap={12}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: tw`
          group relative flex w-full items-center justify-between gap-3 rounded-2xl p-4 border
          backdrop-blur-2xl
          transition-all duration-300 ease-out
          max-w-md min-w-[320px]
          overflow-hidden
        `,
          title: tw`
          text-sm font-medium text-text
          leading-tight relative z-10
        `,
          description: tw`
          text-xs text-text-secondary
          leading-relaxed mt-1 relative z-10
        `,
          content: tw`
          flex-1 min-w-0 relative z-10
        `,
          icon: tw`
          shrink-0 mt-0.5 size-5 relative z-10
          [li[data-type="success"]_&]:text-green
          [li[data-type="error"]_&]:text-red
          [li[data-type="warning"]_&]:text-orange
          [li[data-type="info"]_&]:text-blue
          [li[data-type="loading"]_&]:text-gray
        `,
          actionButton: tw`
          px-2.5 py-1 text-xs font-medium rounded-md
          transition-all duration-200 relative z-10
          focus:outline-none focus:shadow-lg bg-accent
          group-data-[type=success]:bg-green group-data-[type=success]:text-white group-data-[type=success]:hover:bg-green/90 group-data-[type=success]:focus:shadow-green/50
          group-data-[type=error]:bg-red group-data-[type=error]:text-white group-data-[type=error]:hover:bg-red/90 group-data-[type=error]:focus:shadow-red/50
          group-data-[type=warning]:bg-orange group-data-[type=warning]:text-white group-data-[type=warning]:hover:bg-orange/90 group-data-[type=warning]:focus:shadow-orange/50
          group-data-[type=info]:bg-blue group-data-[type=info]:text-white group-data-[type=info]:hover:bg-blue/90 group-data-[type=info]:focus:shadow-blue/50
          group-data-[type=loading]:bg-gray group-data-[type=loading]:text-white group-data-[type=loading]:hover:bg-gray/90 group-data-[type=loading]:focus:shadow-gray/50
          hover:shadow-md active:scale-95
        `,
          cancelButton: tw`
          px-2.5 py-1 text-xs font-medium rounded-md relative z-10
          bg-fill-secondary text-text-secondary
          hover:bg-fill-tertiary hover:text-text
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-fill/50 focus:ring-offset-1
        `,
          closeButton: tw`
          absolute top-2 right-2 w-6 h-6 rounded-full z-10
          flex items-center justify-center
          bg-fill text-text-tertiary
          hover:bg-fill-secondary hover:text-text-secondary
          active:bg-fill-tertiary active:text-text
          transition-all duration-200
          opacity-0 group-hover:opacity-100
          focus:outline-none focus:ring-2 focus:ring-accent/50
          focus:opacity-100
        `,
        },
      }}
      icons={{
        success: <i className="i-mingcute-check-circle-fill" />,
        error: <i className="i-mingcute-close-circle-fill" />,
        warning: <i className="i-mingcute-warning-fill" />,
        info: <i className="i-mingcute-information-fill" />,
        loading: (
          <i className="i-mingcute-loading-3-fill animate-spin !duration-1000" />
        ),
      }}
      {...props}
    />
  )
}

export { Toaster }
