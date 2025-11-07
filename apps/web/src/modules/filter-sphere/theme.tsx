import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@afilmory/ui'
import { clsxm } from '@afilmory/utils'
import {
  createFilterGroup,
  createFilterTheme,
  createSingleFilter,
  useFilterGroup,
  useFilterRule,
  useRootRule,
  useView,
} from '@fn-sphere/filter'
import { m } from 'motion/react'
import { useCallback } from 'react'

export const EMPTY_ARRAY: never[] = []

/**
 * Glassmorphic theme for Filter Sphere
 * Following the Glassmorphic Depth Design System for elevated UI components
 */
export const filterSphereTheme = createFilterTheme({
  components: {
    Button,
    Input: ({ onChange, ...props }) => {
      return <Input onChange={(e) => onChange?.(e.target.value)} {...props} />
    },
    Select: ({ value, options = EMPTY_ARRAY, onChange }) => {
      const selectedIdx = options.findIndex((option) => option.value === value)
      const handleChange = useCallback(
        (index: string) => {
          const idx = Number(index)
          const selectedOption = options[idx]
          if (!selectedOption) return
          onChange?.(selectedOption.value)
        },
        [options, onChange],
      )
      return (
        <Select value={String(selectedIdx)} onValueChange={handleChange}>
          <SelectTrigger
            className={clsxm(
              'h-9 backdrop-blur-md bg-accent/5 border-accent/20',
              'hover:bg-accent/10 hover:border-accent/30',
              'focus:ring-accent/40',
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options?.map(({ label }, idx) => (
              <SelectItem key={label} value={String(idx)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
  },

  templates: {
    // Single filter rule template with glassmorphic styling
    SingleFilter: ({ rule }) => {
      const {
        ruleState: { isLastRule, isValid, parentGroup },
        removeRule,
        appendRule,
      } = useFilterRule(rule)
      const { rootRule, numberOfRules, setRootRule } = useRootRule()
      const { Button: ButtonView } = useView('components')
      const { FieldSelect, FilterSelect, FilterDataInput } = useView('templates')

      const isLastRuleInGroup = isLastRule && rootRule.conditions.at(-1)?.id === parentGroup.id

      return (
        <m.div
          className={clsxm(
            'flex items-center gap-2 rounded-lg p-3',
            'border border-accent/10 bg-accent/3',
            'backdrop-blur-md',
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-1 items-center gap-2">
            <FieldSelect rule={rule} />
            <FilterSelect rule={rule} />
            <FilterDataInput rule={rule} />
          </div>

          <div className="flex items-center gap-1">
            <ButtonView
              onClick={() => {
                appendRule(createSingleFilter())
              }}
            >
              And
            </ButtonView>
            {isLastRuleInGroup && (
              <ButtonView
                onClick={() => {
                  rootRule.conditions.push(
                    createFilterGroup({
                      op: 'and',
                      conditions: [createSingleFilter()],
                    }),
                  )
                  setRootRule(rootRule)
                }}
              >
                Or
              </ButtonView>
            )}
            {!isValid && (
              <div className="text-red/80 text-sm" title="Invalid rule">
                ⚠
              </div>
            )}
            {numberOfRules > 1 && (
              <button
                type="button"
                className={clsxm(
                  'size-8 rounded-md',
                  'text-text/60 hover:text-text hover:bg-red/10',
                  'transition-all duration-200',
                  'flex items-center justify-center',
                )}
                onClick={() => removeRule(true)}
                title="Remove rule"
              >
                <i className="i-mingcute-close-line size-4" />
              </button>
            )}
          </div>
        </m.div>
      )
    },

    // Filter group container with glassmorphic card styling
    FilterGroupContainer: ({ children }) => (
      <m.div
        className={clsxm(
          'flex flex-col gap-3 rounded-xl p-4',
          // Glassmorphic depth styling
          'border border-accent/20 backdrop-blur-2xl',
          'bg-linear-to-br from-accent/8 to-accent/3',
        )}
        style={{
          boxShadow: `
            0 8px 32px color-mix(in srgb, var(--accent) 8%, transparent),
            0 2px 8px color-mix(in srgb, var(--accent) 5%, transparent),
            inset 0 1px 0 color-mix(in srgb, var(--accent) 10%, transparent)
          `,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
      >
        {children}
      </m.div>
    ),

    // Filter group template with custom layout
    FilterGroup: ({ rule }) => {
      const { FilterGroup: GroupView, SingleFilter: RuleView } = useView('templates')
      const {
        ruleState: { depth },
        appendChildRule,
        appendChildGroup,
        toggleGroupOp,
      } = useFilterGroup(rule)

      const { Button: ButtonView } = useView('components')
      const { RuleJoiner } = useView('templates')

      return (
        <m.div
          className={clsxm(
            'flex flex-col gap-3 rounded-xl p-4',
            // Glassmorphic depth styling
            'border border-accent/20 backdrop-blur-2xl',
            'bg-linear-to-br from-accent/8 to-accent/3',
          )}
          style={{
            boxShadow: `
            0 8px 32px color-mix(in srgb, var(--accent) 8%, transparent),
            0 2px 8px color-mix(in srgb, var(--accent) 5%, transparent),
            inset 0 1px 0 color-mix(in srgb, var(--accent) 10%, transparent)
          `,
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex flex-col gap-2">
            {rule.conditions.map((childRule, groupIdx) => {
              const nextRule = rule.conditions[groupIdx + 1]
              return (
                <div key={childRule.id}>
                  <div className="flex items-start gap-2">
                    {groupIdx === 0 ? (
                      <div
                        className={clsxm(
                          'flex h-9 min-w-16 items-center justify-center rounded-md',
                          'text-accent/80 bg-accent/10 border border-accent/20',
                          'text-sm font-medium',
                        )}
                      >
                        WHERE
                      </div>
                    ) : (
                      <ButtonView
                        onClick={() => toggleGroupOp()}
                        className={clsxm('min-w-16', 'hover:bg-accent/15 hover:border-accent/30')}
                      >
                        {rule.op.toUpperCase()}
                      </ButtonView>
                    )}
                    <div className="flex-1">
                      {childRule.type === 'Filter' ? <RuleView rule={childRule} /> : <GroupView rule={childRule} />}
                    </div>
                  </div>
                  {nextRule && <RuleJoiner joinBetween={[childRule, nextRule]} parent={rule} />}
                </div>
              )
            })}
          </div>

          <div className="border-accent/10 mt-2 flex items-center gap-2 border-t pt-3">
            <ButtonView onClick={() => appendChildRule({})}>
              <i className="i-mingcute-add-line mr-1 size-4" />
              Add Rule
            </ButtonView>
            {depth < 2 && (
              <ButtonView
                onClick={() =>
                  appendChildGroup({
                    op: 'and',
                    conditions: [createSingleFilter()],
                  })
                }
              >
                <i className="i-mingcute-add-circle-line mr-1 size-4" />
                Add Group
              </ButtonView>
            )}
          </div>
        </m.div>
      )
    },
  },
})
