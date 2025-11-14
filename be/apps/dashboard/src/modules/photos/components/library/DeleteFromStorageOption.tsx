import { Checkbox } from '@afilmory/ui'

type DeleteFromStorageOptionProps = {
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}

export function DeleteFromStorageOption({ defaultChecked = false, disabled, onChange }: DeleteFromStorageOptionProps) {
  return (
    <label className="flex w-full items-start gap-3 my-2 text-left text-text">
      <Checkbox
        size="md"
        defaultChecked={defaultChecked}
        disabled={disabled}
        onCheckedChange={(value) => {
          onChange?.(Boolean(value))
        }}
      />
      <div className="space-y-1 text-sm leading-relaxed">
        <p className="font-medium">同时删除存储文件</p>
        <p className="text-xs text-text-tertiary">
          勾选后将一并移除对象存储或 Git 仓库中的原始文件与缩略图，默认为保留远程文件。
        </p>
      </div>
    </label>
  )
}
