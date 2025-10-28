import type { ModalComponentProps } from '@afilmory/ui'
import {
  Button,
  FormHelperText,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@afilmory/ui'
import { clsxm, Spring } from '@afilmory/utils'
import { DynamicIcon } from 'lucide-react/dynamic'
import { m } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'

import {
  STORAGE_PROVIDER_FIELD_DEFINITIONS,
  STORAGE_PROVIDER_TYPE_OPTIONS,
} from '../constants'
import type { StorageProvider, StorageProviderType } from '../types'

type ProviderEditModalProps = ModalComponentProps & {
  provider: StorageProvider | null
  activeProviderId: string | null
  onSave: (provider: StorageProvider) => void
  onSetActive: (id: string) => void
  onDelete: (id: string) => void
}

export const ProviderEditModal = ({
  provider,
  activeProviderId,
  onSave,
  onSetActive,
  onDelete,
  dismiss,
}: ProviderEditModalProps) => {
  const [formData, setFormData] = useState<StorageProvider | null>(provider)
  const [isDirty, setIsDirty] = useState(false)

  // Reset form when provider changes (e.g., when modal opens with new provider)
  const providerKey = provider?.id || 'new'
  useEffect(() => {
    setFormData(provider)
    setIsDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerKey])

  const isActive = provider?.id === activeProviderId
  const isNewProvider = !provider?.id

  const selectedFields = useMemo(() => {
    if (!formData) return []
    return STORAGE_PROVIDER_FIELD_DEFINITIONS[formData.type] || []
  }, [formData])

  const handleNameChange = (value: string) => {
    if (!formData) return
    setFormData({ ...formData, name: value })
    setIsDirty(true)
  }

  const handleTypeChange = (value: StorageProviderType) => {
    if (!formData) return
    setFormData({
      ...formData,
      type: value,
      config: {}, // Reset config when type changes
    })
    setIsDirty(true)
  }

  const handleConfigChange = (key: string, value: string) => {
    if (!formData) return
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [key]: value,
      },
    })
    setIsDirty(true)
  }

  const handleSave = () => {
    if (!formData) return
    onSave(formData)
    dismiss()
  }

  const handleDelete = () => {
    if (!formData?.id) return
    if (window.confirm('确定要删除这个存储提供商吗？此操作无法撤销。')) {
      onDelete(formData.id)
      dismiss()
    }
  }

  const handleSetActive = () => {
    if (!formData?.id) return
    onSetActive(formData.id)
  }

  if (!formData) return null

  return (
    <div className="flex h-full max-h-[85vh] flex-col">
      {/* Header */}
      <div className="shrink-0 space-y-3 px-6 pt-6">
        <div className="flex items-start gap-3">
          <div
            className={clsxm(
              'flex size-10 shrink-0 items-center justify-center rounded',
              isNewProvider ? 'bg-accent/10 text-accent' : 'bg-fill text-text',
            )}
          >
            <DynamicIcon
              name={isNewProvider ? 'plus-circle' : 'edit'}
              className="size-5"
            />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="text-text text-xl font-semibold">
              {isNewProvider ? 'Add Storage Provider' : 'Edit Provider'}
            </h2>
            <p className="text-text-tertiary text-sm">
              {isNewProvider
                ? 'Configure a new storage provider for your photos'
                : 'Update provider configuration and credentials'}
            </p>
          </div>
        </div>

        {/* Horizontal divider */}
        <div className="via-text/20 h-[0.5px] bg-linear-to-r from-transparent to-transparent" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea rootClassName="h-full" viewportClassName="h-full">
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={Spring.presets.smooth}
            className="space-y-6 px-6 py-4"
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-text text-sm font-semibold">
                Basic Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provider-name">Display Name</Label>
                  <Input
                    id="provider-name"
                    value={formData.name}
                    onInput={(e) => handleNameChange(e.currentTarget.value)}
                    placeholder="e.g., Production S3"
                    className="bg-background/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider-type">Provider Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      handleTypeChange(value as StorageProviderType)
                    }
                  >
                    <SelectTrigger id="provider-type">
                      <SelectValue placeholder="Select provider type" />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGE_PROVIDER_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Configuration Fields */}
            {selectedFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-text text-sm font-semibold">
                  Connection Configuration
                </h3>
                <div className="space-y-4">
                  {selectedFields.map((field) => {
                    const value = formData.config[field.key] || ''
                    return (
                      <div
                        key={field.key}
                        className="border-fill-tertiary/40 bg-background/30 space-y-2 rounded border p-4"
                      >
                        <div className="space-y-1">
                          <Label
                            htmlFor={`field-${field.key}`}
                            className="font-semibold"
                          >
                            {field.label}
                          </Label>
                          {field.description && (
                            <p className="text-text-tertiary text-xs">
                              {field.description}
                            </p>
                          )}
                        </div>

                        {field.multiline ? (
                          <Textarea
                            id={`field-${field.key}`}
                            value={value}
                            onInput={(e) =>
                              handleConfigChange(
                                field.key,
                                e.currentTarget.value,
                              )
                            }
                            placeholder={field.placeholder}
                            rows={3}
                            className="bg-background/60"
                          />
                        ) : (
                          <Input
                            id={`field-${field.key}`}
                            type={field.sensitive ? 'password' : 'text'}
                            value={value}
                            onInput={(e) =>
                              handleConfigChange(
                                field.key,
                                e.currentTarget.value,
                              )
                            }
                            placeholder={field.placeholder}
                            className="bg-background/60"
                            autoComplete="off"
                          />
                        )}

                        {field.helper && (
                          <FormHelperText>{field.helper}</FormHelperText>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </m.div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 pt-4 pb-6">
        {/* Horizontal divider */}
        <div className="via-text/20 mb-4 h-[0.5px] bg-linear-to-r from-transparent to-transparent" />

        {isNewProvider ? (
          // Add mode: Simple cancel + create actions
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              onClick={dismiss}
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              variant="primary"
              size="sm"
            >
              <DynamicIcon name="plus" className="h-3.5 w-3.5" />
              <span>Create Provider</span>
            </Button>
          </div>
        ) : (
          // Edit mode: Delete + cancel + set active + save
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              className="text-red hover:bg-red/10"
            >
              <DynamicIcon name="trash-2" className="h-3.5 w-3.5" />
              <span>Delete</span>
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={dismiss}
                variant="ghost"
                size="sm"
                className="text-text-secondary hover:text-text"
              >
                Cancel
              </Button>

              {isActive ? (
                <span className="bg-accent inline-flex items-center gap-1.5 rounded px-4 py-2 text-xs font-semibold text-white uppercase">
                  <DynamicIcon name="check-circle" className="h-3.5 w-3.5" />
                  Active
                </span>
              ) : (
                <Button
                  type="button"
                  onClick={handleSetActive}
                  variant="ghost"
                  size="sm"
                  className="border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 border"
                >
                  <DynamicIcon name="check" className="h-3.5 w-3.5" />
                  <span>Set Active</span>
                </Button>
              )}

              <Button
                type="button"
                onClick={handleSave}
                disabled={!isDirty}
                variant="primary"
                size="sm"
              >
                <DynamicIcon name="save" className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Configure modal content
ProviderEditModal.contentClassName = 'max-w-2xl w-[95vw] max-h-[90vh] p-0'
ProviderEditModal.contentProps = {
  style: {
    maxHeight: '90vh',
  },
}
