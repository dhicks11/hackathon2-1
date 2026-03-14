// src/app/api/pitch-deck/export/route.ts
// Exports pitch deck slides to .pptx using pptxgenjs
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slides, ideaId, format = 'pptx' } = await req.json()
  if (!slides?.length) return NextResponse.json({ error: 'No slides' }, { status: 400 })

  if (format === 'pptx') {
    const PptxGenJS = (await import('pptxgenjs')).default
    const pptx = new PptxGenJS()

    pptx.layout = 'LAYOUT_WIDE'
    pptx.author = 'PitchPad - Lenovo Innovation'

    const LENOVO_RED = 'E2001A'
    const DARK = '111111'
    const GRAY = '666666'
    const LIGHT_GRAY = 'F2F2F2'

    for (const slide of slides) {
      const s = pptx.addSlide()

      s.background = { color: slide.type === 'cover' ? DARK : 'FFFFFF' }

      s.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 0.06,
        fill: { color: LENOVO_RED },
        line: { type: 'none' },
      })

      s.addText(String(slide.type || '').toUpperCase(), {
        x: 0.5, y: 0.25, w: 2, h: 0.25,
        fontSize: 8, bold: true, color: slide.type === 'cover' ? 'AAAAAA' : LENOVO_RED,
        fontFace: 'IBM Plex Sans',
      })

      s.addText(String(slide.id || '').padStart(2, '0'), {
        x: 11.5, y: 0.25, w: 0.5, h: 0.25,
        fontSize: 8, color: slide.type === 'cover' ? '555555' : 'CCCCCC',
        fontFace: 'IBM Plex Mono', align: 'right',
      })

      s.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 0.65, w: 0.4, h: 0.04,
        fill: { color: LENOVO_RED },
        line: { type: 'none' },
      })

      s.addText(slide.headline || '', {
        x: 0.5, y: 0.8, w: 11,
        fontSize: slide.type === 'cover' ? 36 : 28,
        bold: true,
        color: slide.type === 'cover' ? 'FFFFFF' : DARK,
        fontFace: 'IBM Plex Sans',
        charSpacing: -0.5,
        breakLine: false,
        autoFit: true,
      })

      s.addText(slide.body || '', {
        x: 0.5, y: 1.9, w: slide.metric ? 8 : 11, h: 1.5,
        fontSize: 13,
        color: slide.type === 'cover' ? 'AAAAAA' : GRAY,
        fontFace: 'IBM Plex Sans',
        valign: 'top',
        breakLine: false,
        autoFit: true,
      })

      if (slide.bullets?.length) {
        const bulletY = slide.body ? 3.6 : 2.4
        slide.bullets.slice(0, 4).forEach((bullet: string, i: number) => {
          s.addText(`- ${bullet}`, {
            x: 0.5, y: bulletY + i * 0.45, w: 11,
            fontSize: 12,
            color: slide.type === 'cover' ? 'CCCCCC' : '444444',
            fontFace: 'IBM Plex Sans',
          })
        })
      }

      if (slide.metric) {
        s.addShape(pptx.ShapeType.rect, {
          x: 9.2, y: 1.7, w: 2.8, h: 1.4,
          fill: { color: LIGHT_GRAY },
          line: { type: 'none' },
        })
        s.addText(slide.metric.value, {
          x: 9.2, y: 1.8, w: 2.8, h: 0.7,
          fontSize: 28, bold: false, color: LENOVO_RED,
          fontFace: 'IBM Plex Mono', align: 'center',
        })
        s.addText(String(slide.metric.label || '').toUpperCase(), {
          x: 9.2, y: 2.5, w: 2.8, h: 0.35,
          fontSize: 8, color: GRAY, fontFace: 'IBM Plex Sans', align: 'center',
        })
      }

      if (slide.type === 'cover') {
        s.addText('LENOVO PITCHPAD', {
          x: 0.5, y: 6.8, w: 5, h: 0.3,
          fontSize: 9, color: '444444', fontFace: 'IBM Plex Mono',
        })
      }
    }

    const buffer = await pptx.write('nodebuffer')
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="pitchpad-${ideaId}.pptx"`,
      },
    })
  }

  return NextResponse.json({ error: 'PDF export coming soon - use PPTX for now' }, { status: 501 })
}
