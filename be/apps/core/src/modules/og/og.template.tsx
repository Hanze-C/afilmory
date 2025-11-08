/** @jsxImportSource hono/jsx */
import type { JSX } from 'hono/jsx'

export interface FrameDimensions {
  frameWidth: number
  frameHeight: number
  imageAreaWidth: number
  imageAreaHeight: number
  displayWidth: number
  displayHeight: number
}

export interface ExifInfo {
  focalLength?: string | null
  aperture?: string | null
  iso?: string | number | null
  shutterSpeed?: string | null
  camera?: string | null
}

export interface OgTemplateProps {
  photoTitle: string
  photoDescription: string
  tags: string[]
  formattedDate?: string
  exifInfo?: ExifInfo | null
  thumbnailSrc?: string | null
  frame: FrameDimensions
  photoId: string
}

export function OgTemplate({
  photoTitle,
  photoDescription,
  tags,
  formattedDate,
  exifInfo,
  thumbnailSrc,
  frame,
  photoId,
}: OgTemplateProps): JSX.Element {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        background:
          'linear-gradient(145deg, #0d0d0d 0%, #1c1c1c 20%, #121212 40%, #1a1a1a 60%, #0f0f0f 80%, #0a0a0a 100%)',
        padding: '80px',
        fontFamily: 'Geist, system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.03,
          background: `
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
          backgroundSize: '60px 60px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(60,60,70,0.15) 0%, rgba(40,40,50,0.08) 40%, transparent 70%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '0px',
          right: '0px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,45,55,0.12) 0%, rgba(30,30,40,0.06) 50%, transparent 80%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '5%',
          right: '25%',
          width: '180px',
          height: '480px',
          background:
            'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 60%, transparent 100%)',
          transform: 'rotate(15deg)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '5%',
          width: '30px',
          height: '180px',
          background: 'linear-gradient(0deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '3px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {Array.from({ length: 6 }).map((_value, index) => (
          <div
            key={index}
            style={{
              marginTop: index === 0 ? '9px' : '15px',
              width: '9px',
              height: '9px',
              background: '#0a0a0a',
              borderRadius: '50%',
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          top: '30%',
          right: '12%',
          width: '120px',
          height: '120px',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '5px',
          transform: 'rotate(12deg)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '35%',
          right: '15%',
          width: '90px',
          height: '90px',
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: '3px',
          transform: 'rotate(-8deg)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          left: '12%',
          width: '72px',
          height: '72px',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '50%',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '40%',
          right: '8%',
          width: '48px',
          height: '48px',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '30px',
            height: '30px',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '15px',
              height: '15px',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          maxWidth: '58%',
        }}
      >
        <h1
          style={{
            fontSize: '80px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0',
            lineHeight: '1.1',
            letterSpacing: '1px',
            display: 'flex',
          }}
        >
          {photoTitle || 'Untitled Photo'}
        </h1>

        <p
          style={{
            fontSize: '36px',
            color: 'rgba(255,255,255,0.9)',
            margin: '0 0 16px 0',
            lineHeight: '1.3',
            letterSpacing: '0.3px',
            display: 'flex',
            fontFamily: 'Geist, SF Pro Display',
          }}
        >
          {photoDescription}
        </p>

        {tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              margin: '0 0 32px 0',
            }}
          >
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  fontSize: '26px',
                  color: 'rgba(255,255,255,0.9)',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  padding: '12px 20px',
                  borderRadius: '24px',
                  letterSpacing: '0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                  fontFamily: 'Geist, SF Pro Display',
                }}
              >
                #{tag}
              </div>
            ))}
          </div>
        )}
      </div>

      {thumbnailSrc && (
        <div
          style={{
            position: 'absolute',
            top: '75px',
            right: '45px',
            width: `${frame.frameWidth}px`,
            height: `${frame.frameHeight}px`,
            background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
            borderRadius: '6px',
            border: '1px solid #2a2a2a',
            boxShadow: '0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '0px',
              top: '0px',
              width: '30px',
              height: '100%',
              background: 'linear-gradient(90deg, #0a0a0a 0%, #111 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-around',
              paddingTop: '25px',
              paddingBottom: '25px',
            }}
          >
            {Array.from({ length: 7 }).map((_value, index) => (
              <div
                key={index}
                style={{
                  width: '10px',
                  height: '10px',
                  background: 'radial-gradient(circle, #000 40%, #222 70%, #333 100%)',
                  borderRadius: '50%',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
                }}
              />
            ))}
          </div>

          <div
            style={{
              position: 'absolute',
              right: '0px',
              top: '0px',
              width: '30px',
              height: '100%',
              background: 'linear-gradient(90deg, #111 0%, #0a0a0a 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-around',
              paddingTop: '25px',
              paddingBottom: '25px',
            }}
          >
            {Array.from({ length: 7 }).map((_value, index) => (
              <div
                key={index}
                style={{
                  width: '10px',
                  height: '10px',
                  background: 'radial-gradient(circle, #000 40%, #222 70%, #333 100%)',
                  borderRadius: '50%',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
                }}
              />
            ))}
          </div>

          <div
            style={{
              position: 'absolute',
              left: '30px',
              top: '30px',
              width: `${frame.imageAreaWidth}px`,
              height: `${frame.imageAreaHeight}px`,
              background: '#000',
              borderRadius: '2px',
              border: '2px solid #1a1a1a',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: `${frame.displayWidth}px`,
                height: `${frame.displayHeight}px`,
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <img
                src={thumbnailSrc}
                style={{
                  width: `${frame.displayWidth}px`,
                  height: `${frame.displayHeight}px`,
                  objectFit: 'cover',
                }}
              />
            </div>

            <div
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                background:
                  'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.06) 25%, transparent 45%, transparent 55%, rgba(255,255,255,0.03) 75%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '30px',
              width: `${frame.imageAreaWidth}px`,
              height: '30px',
              background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 30%, #1a1a1a 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '30px',
              width: `${frame.imageAreaWidth}px`,
              height: '30px',
              background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 30%, #1a1a1a 100%)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '38px',
              fontSize: '14px',
              color: '#555',
              fontFamily: 'monospace',
              letterSpacing: '0.5px',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {photoId}
          </div>

          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '42px',
              fontSize: '14px',
              color: '#555',
              letterSpacing: '0.5px',
              fontFamily: 'monospace',
              background: 'rgba(0,0,0,0.4)',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            FILM 400 | STUDIO CUT
          </div>

          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '80%',
              height: '80%',
              border: '1px dashed rgba(255,255,255,0.05)',
              transform: 'translate(-50%, -50%)',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '28px',
        }}
      >
        {formattedDate && (
          <div
            style={{
              fontSize: '28px',
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            📸 {formattedDate}
          </div>
        )}

        {exifInfo?.camera && (
          <div
            style={{
              fontSize: '25px',
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.3px',
              display: 'flex',
            }}
          >
            📷 {exifInfo.camera}
          </div>
        )}

        {exifInfo && (exifInfo.aperture || exifInfo.shutterSpeed || exifInfo.iso || exifInfo.focalLength) && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '18px',
              fontSize: '25px',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            {exifInfo.aperture && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                ⚫ {exifInfo.aperture}
              </div>
            )}

            {exifInfo.shutterSpeed && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                ⏱️ {exifInfo.shutterSpeed}
              </div>
            )}

            {exifInfo.iso && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                📊 ISO {exifInfo.iso}
              </div>
            )}

            {exifInfo.focalLength && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                🔍 {exifInfo.focalLength}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
