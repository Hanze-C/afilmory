import type { PhotoManifestItem, PickedExif } from '@afilmory/builder'
import type { ModalComponent } from '@afilmory/ui'
import { DialogDescription, DialogHeader, DialogTitle, LinearDivider, ScrollArea } from '@afilmory/ui'
import { clsxm } from '@afilmory/utils'

type Section = {
  title: string
  rows: { label: string; value: string }[]
}

type PhotoExifDetailsModalProps = {
  manifest: PhotoManifestItem
}

const candidateKeys = (key: string): string[] => {
  const variations = new Set<string>([
    key,
    key.toLowerCase(),
    key.toUpperCase(),
    key.charAt(0).toLowerCase() + key.slice(1),
    key.charAt(0).toUpperCase() + key.slice(1),
  ])
  return Array.from(variations)
}

const getExifValue = <T = unknown,>(exif: PickedExif | null, ...keys: string[]): T | null => {
  if (!exif) return null
  const record = exif
  for (const key of keys) {
    for (const candidate of candidateKeys(key)) {
      if (candidate in record) {
        const value = record[candidate]
        if (value !== undefined && value !== null && value !== '') {
          return value as T
        }
      }
    }
  }
  return null
}

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const formatFileSize = (size?: number | null): string | null => {
  if (!size || size <= 0) return null
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / 1024 ** exponent
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`
}

const formatShutterSpeed = (exif: PickedExif | null): string | null => {
  const source = getExifValue<number | string>(exif, 'ExposureTime', 'ShutterSpeedValue', 'ShutterSpeed')
  if (!source) return null
  if (typeof source === 'number') {
    if (source >= 1) {
      return `${source.toFixed(1).replace(/\\.0$/, '')}s`
    }
    const denominator = Math.round(1 / source)
    return `1/${denominator}s`
  }
  const stringified = String(source)
  return stringified.endsWith('s') ? stringified : `${stringified}s`
}

const formatAperture = (exif: PickedExif | null): string | null => {
  const value = getExifValue<number | string>(exif, 'FNumber', 'Aperture', 'ApertureValue', 'MaxApertureValue')
  if (value === null) return null
  const numeric = parseNumber(value)
  if (numeric === null) {
    const stringified = String(value)
    return stringified.startsWith('f/') ? stringified : `f/${stringified}`
  }
  return `f/${numeric.toFixed(1).replace(/\\.0$/, '')}`
}

const formatExposureCompensation = (value?: number | string | null): string | null => {
  if (value === undefined || value === null || value === '') return null
  const normalized = parseNumber(value)
  if (normalized === null) return String(value)
  const formatted = normalized === 0 ? '0' : normalized.toFixed(1).replace(/\\.0$/, '')
  return `${normalized > 0 ? '+' : ''}${formatted} EV`
}

const formatFocalLength = (source?: string | number | null): string | null => {
  if (!source && source !== 0) return null
  const value = String(source)
  if (/mm$/i.test(value)) return value
  const numeric = parseNumber(source)
  return numeric !== null ? `${numeric}mm` : value
}

const formatDateLabel = (value?: string | null): string | null => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleString()
}

const toReadableValue = (maybeValue: unknown): string | null => {
  if (maybeValue === null || maybeValue === undefined) return null
  if (Array.isArray(maybeValue)) return maybeValue.join(', ')
  return String(maybeValue)
}

const convertGPSToDecimal = (
  exif: PickedExif | null,
): { latitude: string; longitude: string; altitude?: string } | null => {
  const latitudeValue = getExifValue<number | string>(exif, 'GPSLatitude')
  const longitudeValue = getExifValue<number | string>(exif, 'GPSLongitude')
  if (latitudeValue === null || longitudeValue === null) return null
  const latitude = Number(latitudeValue)
  const longitude = Number(longitudeValue)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  const latitudeRef = getExifValue<string>(exif, 'GPSLatitudeRef')
  const longitudeRef = getExifValue<string>(exif, 'GPSLongitudeRef')
  const altitudeRaw = getExifValue<number | string>(exif, 'GPSAltitude')
  const altitudeRef = getExifValue<string>(exif, 'GPSAltitudeRef')
  const altitudeNumber = parseNumber(altitudeRaw)
  const altitudeValue =
    altitudeNumber !== null ? `${altitudeNumber}${altitudeRef === 'Below Sea Level' ? 'm (海平面下)' : 'm'}` : null

  return {
    latitude: `${latitude.toFixed(5)}° ${latitudeRef === 'S' || latitudeRef === 'South' ? 'S' : 'N'}`,
    longitude: `${longitude.toFixed(5)}° ${longitudeRef === 'W' || longitudeRef === 'West' ? 'W' : 'E'}`,
    altitude: altitudeValue ?? undefined,
  }
}

const getFormatLabel = (manifest: PhotoManifestItem): string | null => {
  const source = manifest.originalUrl || manifest.s3Key
  if (!source) return null
  const cleanPath = source.split(/[?#]/)[0]
  const parts = cleanPath.split('.')
  if (parts.length <= 1) return null
  return parts.pop()?.toUpperCase() ?? null
}

const buildSections = (manifest: PhotoManifestItem): Section[] => {
  const { exif } = manifest
  const sections: Section[] = []

  const basicRows = [
    { label: '标题', value: manifest.title || manifest.id },
    { label: '照片 ID', value: manifest.id },
    { label: '拍摄时间', value: formatDateLabel(getExifValue<string>(exif, 'DateTimeOriginal') ?? manifest.dateTaken) },
    { label: '分辨率', value: `${manifest.width} × ${manifest.height}` },
    { label: '像素数量', value: `${Math.round((manifest.width * manifest.height) / 1_000_000)} MP` },
    { label: '文件大小', value: formatFileSize(manifest.size) },
    { label: '文件格式', value: getFormatLabel(manifest) },
    { label: '宽高比', value: manifest.aspectRatio ? manifest.aspectRatio.toFixed(2) : null },
  ].filter((row) => row.value)

  if (basicRows.length > 0) {
    sections.push({ title: '基本信息', rows: basicRows as Section['rows'] })
  }

  const captureRows = [
    {
      label: '拍摄设备',
      value: (() => {
        const make = getExifValue<string>(exif, 'Make')
        const model = getExifValue<string>(exif, 'Model')
        return make || model ? [make, model].filter(Boolean).join(' ') : null
      })(),
    },
    {
      label: '镜头',
      value: (() => {
        const lensMake = getExifValue<string>(exif, 'LensMake')
        const lensModel = getExifValue<string>(exif, 'LensModel')
        return lensMake || lensModel ? [lensMake, lensModel].filter(Boolean).join(' ') : null
      })(),
    },
    { label: '光圈', value: formatAperture(exif) },
    { label: '快门', value: formatShutterSpeed(exif) },
    {
      label: '感光度',
      value: (() => {
        const iso = getExifValue<number | string>(exif, 'ISO')
        return iso ? `ISO ${iso}` : null
      })(),
    },
    { label: '曝光补偿', value: formatExposureCompensation(getExifValue(exif, 'ExposureCompensation')) },
    { label: '等效焦距', value: formatFocalLength(getExifValue(exif, 'FocalLengthIn35mmFormat')) },
    { label: '实际焦距', value: formatFocalLength(getExifValue(exif, 'FocalLength')) },
    { label: '曝光程序', value: toReadableValue(getExifValue(exif, 'ExposureProgram')) },
    { label: '测光模式', value: toReadableValue(getExifValue(exif, 'MeteringMode')) },
    { label: '白平衡', value: toReadableValue(getExifValue(exif, 'WhiteBalance')) },
    { label: '场景类型', value: toReadableValue(getExifValue(exif, 'SceneCaptureType')) },
    { label: '闪光灯', value: toReadableValue(getExifValue(exif, 'Flash')) },
    { label: '光源', value: toReadableValue(getExifValue(exif, 'LightSource')) },
    { label: '曝光模式', value: toReadableValue(getExifValue(exif, 'ExposureMode')) },
    {
      label: '亮度值',
      value: (() => {
        const brightness = getExifValue<number | string>(exif, 'BrightnessValue', 'LightValue')
        return brightness ? String(brightness) : null
      })(),
    },
    { label: 'ScaleFactor35efl', value: toReadableValue(getExifValue(exif, 'ScaleFactor35efl')) },
    { label: '感光元件', value: toReadableValue(getExifValue(exif, 'SensingMethod')) },
  ].filter((row) => row.value)

  if (captureRows.length > 0) {
    sections.push({ title: '拍摄参数', rows: captureRows as Section['rows'] })
  }

  const metaRows = [
    { label: '作者', value: toReadableValue(getExifValue(exif, 'Artist')) },
    { label: '版权', value: toReadableValue(getExifValue(exif, 'Copyright')) },
    { label: '软件', value: toReadableValue(getExifValue(exif, 'Software')) },
    {
      label: '评分',
      value: (() => {
        const rating = getExifValue<number>(exif, 'Rating')
        return rating && rating > 0 ? `${'★'.repeat(rating)}` : null
      })(),
    },
    { label: '色彩空间', value: toReadableValue(getExifValue(exif, 'ColorSpace')) },
    { label: '时区', value: getExifValue<string>(exif, 'zone', 'tz') },
    { label: '时区来源', value: toReadableValue(getExifValue(exif, 'tzSource')) },
    { label: '时间偏移', value: toReadableValue(getExifValue(exif, 'OffsetTime', 'OffsetTimeOriginal')) },
  ].filter((row) => row.value)

  if (metaRows.length > 0) {
    sections.push({ title: '元数据', rows: metaRows as Section['rows'] })
  }

  const gps = convertGPSToDecimal(exif)
  const locationRows = [
    { label: '纬度', value: gps?.latitude ?? null },
    { label: '经度', value: gps?.longitude ?? null },
    { label: '海拔', value: gps?.altitude ?? null },
  ].filter((row) => row.value)

  if (locationRows.length > 0) {
    sections.push({ title: '位置信息', rows: locationRows as Section['rows'] })
  }

  const fujiRecipe = getExifValue<Record<string, unknown>>(exif, 'FujiRecipe')
  if (fujiRecipe) {
    const recipeRows = Object.entries(fujiRecipe)
      .map(([key, value]) => ({
        label: key
          .replaceAll(/([A-Z])/g, ' $1')
          .replace(/^./, (char) => char.toUpperCase())
          .trim(),
        value: toReadableValue(value),
      }))
      .filter((row) => row.value)

    if (recipeRows.length > 0) {
      sections.push({ title: '富士胶片配方', rows: recipeRows as Section['rows'] })
    }
  }

  return sections
}

export const PhotoExifDetailsModal: ModalComponent<PhotoExifDetailsModalProps> = ({ manifest }) => {
  const sections = buildSections(manifest)
  const hasExif = manifest.exif !== null

  return (
    <div className="flex max-h-[80vh] w-full flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{manifest.title || manifest.id}</DialogTitle>
        <DialogDescription>
          <p className="text-text-tertiary text-xs">文件：{manifest.s3Key}</p>
        </DialogDescription>
      </DialogHeader>

      <LinearDivider />

      <div className="relative flex-1 pr-1 -mx-6 -mb-6">
        {hasExif ? (
          <ScrollArea rootClassName="h-[60vh]" viewportClassName="px-6 pb-6">
            <div className="space-y-6">
              {sections.map((section) => (
                <section key={section.title}>
                  <h3 className="text-text-secondary text-sm font-semibold">{section.title}</h3>
                  <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                    {section.rows.map((row) => (
                      <div key={`${section.title}-${row.label}`}>
                        <dt className="text-text-tertiary text-[11px] uppercase tracking-wider">{row.label}</dt>
                        <dd className="text-text mt-0.5 font-medium">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="border-fill-tertiary/50 bg-background/70 rounded-xl border px-4 py-8 text-center text-sm text-text-tertiary">
            当前资源缺少 EXIF 数据。
          </div>
        )}
      </div>
    </div>
  )
}

PhotoExifDetailsModal.contentClassName = clsxm('w-[min(640px,95vw)] p-6')
