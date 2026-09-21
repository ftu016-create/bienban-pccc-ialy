import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeightRule,
  TableBorders,
  ITableCellBorders,
  IBorderOptions,
  ImageRun,
  PageOrientation,
} from 'docx';
import saveAs from 'file-saver';
import { ReportData } from '../types';
import { getSignatureForPerson } from '../data/sampleSignatures';
import { signatureToPngBytes } from '../utils/signatureUtils';
import { attachmentService } from './attachmentService';
import { pdfMergeService } from './pdfMergeService';

const FONT_NAME = 'Times New Roman';
const SIZE_MAIN = 26; // 13pt in half-points
const SIZE_SUB = 22; // 11pt
const SIZE_TITLE = 28; // 14pt

// Vietnamese Administrative Standard (Nghị định 30/2020/NĐ-CP):
// Margin: Left 3.0cm (1701 dxa), Top/Bottom/Right 2.0cm (1134 dxa)
// First-line indent: 1.2cm (680 dxa)
const MARGIN_LEFT = 1701;
const MARGIN_RIGHT = 1134;
const MARGIN_TOP = 1134;
const MARGIN_BOTTOM = 1134;
const INDENT_FIRST_LINE = 680;

const formatPersonName = (rawName: string) => {
  const clean = rawName.trim().replace(/^-\s*/, '');
  if (clean.toLowerCase().startsWith('ông')) {
    return `- ${clean}`;
  }
  return `- Ông: ${clean}`;
};

const formatPersonRole = (rawRole: string) => {
  const clean = rawRole.trim();
  if (clean.toLowerCase().startsWith('chức vụ:')) {
    return clean;
  }
  return `Chức vụ: ${clean}`;
};

const tableCellPadding = {
  top: 100,
  bottom: 100,
  left: 120,
  right: 120,
};

const borderThin: IBorderOptions = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '000000',
};

const borderNone: IBorderOptions = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

const cellAllBorders: ITableCellBorders = {
  top: borderThin,
  bottom: borderThin,
  left: borderThin,
  right: borderThin,
};

const cellNoBorders: ITableCellBorders = {
  top: borderNone,
  bottom: borderNone,
  left: borderNone,
  right: borderNone,
};

export async function exportReportToDocx(report: ReportData) {
  // Build header table
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            margins: tableCellPadding,
            borders: cellNoBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'CÔNG TY THỦY ĐIỆN IALY', bold: true, font: FONT_NAME, size: SIZE_SUB }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'PX VẬN HÀNH IALY', bold: true, font: FONT_NAME, size: SIZE_SUB }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
                children: [
                  new TextRun({ text: `Số: ${report.so || '.../VHIALY'}`, font: FONT_NAME, size: SIZE_MAIN }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            margins: tableCellPadding,
            borders: cellNoBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, font: FONT_NAME, size: SIZE_SUB }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, font: FONT_NAME, size: SIZE_SUB, underline: {} }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    text: `${report.place || 'Gia Lai'}, ngày ${report.header_day} tháng ${report.header_month} năm ${report.header_year}`,
                    italics: true,
                    font: FONT_NAME,
                    size: SIZE_MAIN,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // People 2-column borderless table (Tên và Chức vụ)
  // Name 40%, Role 60% at 12pt (size 24) so that all names and long roles comfortably fit on a SINGLE line
  const peopleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: report.people.map(
      (p) =>
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              borders: cellNoBorders,
              margins: { top: 25, bottom: 25, left: 340, right: 30 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: formatPersonName(p.name),
                      font: FONT_NAME,
                      size: 24, // 12pt (chuẩn NĐ 30/2020 cho danh sách)
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              borders: cellNoBorders,
              margins: { top: 25, bottom: 25, left: 30, right: 30 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: formatPersonRole(p.role),
                      font: FONT_NAME,
                      size: 24, // 12pt
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    ),
  });

  // Inspection areas paragraphs with 0.6cm indent so text stays cleanly on 1 line
  const areaLines = (report.inspection_areas || '').split('\n').filter(Boolean);
  const areaParagraphs = areaLines.map(
    (line) =>
      new Paragraph({
        indent: { firstLine: 360 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: line, font: FONT_NAME, size: SIZE_MAIN })],
      })
  );

  // Table 1: Equipments
  const equipHeaderRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          rowSpan: 2,
          width: { size: 7, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 45, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tên trang bị phương tiện, hệ thống', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Số lượng', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          columnSpan: 2,
          width: { size: 22, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tình trạng', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 14, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ghi chú', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
      ],
    }),
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Đạt', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không đạt', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
      ],
    }),
  ];

  const equipDataRows = report.equip.map((item) => {
    if (item.isHeader || ['I', 'II', 'III', 'IV', 'V'].includes(item.stt.trim())) {
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 7, type: WidthType.PERCENTAGE },
            borders: cellAllBorders,
            margins: tableCellPadding,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, bold: true, font: FONT_NAME, size: SIZE_MAIN })] })],
          }),
          new TableCell({
            columnSpan: 5,
            borders: cellAllBorders,
            margins: tableCellPadding,
            children: [new Paragraph({ children: [new TextRun({ text: item.name, bold: true, font: FONT_NAME, size: SIZE_MAIN })] })],
          }),
        ],
      });
    }

    return new TableRow({
      children: [
        new TableCell({
          width: { size: 7, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.name, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.qty, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.ok, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.bad, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.note || '', font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
      ],
    });
  });

  const equipTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...equipHeaderRows, ...equipDataRows],
  });

  // Table 2: Fire
  const fireHeaderRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          rowSpan: 2,
          width: { size: 7, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 40, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nội dung duy trì', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Số lượng', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          columnSpan: 2,
          width: { size: 16, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tình trạng', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          rowSpan: 2,
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ghi chú', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
      ],
    }),
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Đảm bảo', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không đảm bảo', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
        }),
      ],
    }),
  ];

  const fireDataRows = report.fire.map((item) => {
    const qtyParagraphs = (item.qty || '').split('\n').map((l) => new Paragraph({ children: [new TextRun({ text: l, font: FONT_NAME, size: SIZE_MAIN })] }));
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 7, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.name, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: qtyParagraphs.length ? qtyParagraphs : [new Paragraph({ text: '' })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.ok, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.bad, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.note || '', font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
      ],
    });
  });

  const fireTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...fireHeaderRows, ...fireDataRows],
  });

  // Table 3: Escape
  const escapeHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        borders: cellAllBorders,
        margins: tableCellPadding,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        borders: cellAllBorders,
        margins: tableCellPadding,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nội dung duy trì', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
      }),
      new TableCell({
        width: { size: 17, type: WidthType.PERCENTAGE },
        borders: cellAllBorders,
        margins: tableCellPadding,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tình trạng', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
      }),
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: cellAllBorders,
        margins: tableCellPadding,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ghi chú', bold: true, font: FONT_NAME, size: SIZE_SUB })] })],
      }),
    ],
  });

  const escapeDataRows = report.escape.map((item) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.name, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 17, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.status, font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: cellAllBorders,
          margins: tableCellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: item.note || '', font: FONT_NAME, size: SIZE_MAIN })] })],
        }),
      ],
    });
  });

  const escapeTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [escapeHeaderRow, ...escapeDataRows],
  });

  // Signature Table (2 columns)
  const memberSigners = report.people.filter((p) => p.name.trim() && p.name.trim() !== report.manager.trim());
  const numRows = Math.ceil(memberSigners.length / 2);

  // Pre-load / convert signatures to PNG byte arrays for Word
  const memberSigBytesList = await Promise.all(
    memberSigners.map(async (p) => {
      const sigUrl = getSignatureForPerson(p.name, p.signatureImage);
      return sigUrl ? await signatureToPngBytes(sigUrl, 170, 60) : null;
    })
  );

  const managerSigUrl = getSignatureForPerson(report.manager, report.manager_signature);
  const managerSigBytes = managerSigUrl ? await signatureToPngBytes(managerSigUrl, 220, 80) : null;

  const signatureRows: TableRow[] = [];

  for (let i = 0; i < numRows; i++) {
    const p1 = memberSigners[i * 2];
    const p2 = memberSigners[i * 2 + 1];
    const sigBytes1 = memberSigBytesList[i * 2];
    const sigBytes2 = memberSigBytesList[i * 2 + 1];

    const p1Children: Paragraph[] = [];
    if (p1) {
      p1Children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: p1.name.startsWith('Ông') ? p1.name : `- Ông: ${p1.name}`,
              font: FONT_NAME,
              size: SIZE_MAIN,
            }),
          ],
        })
      );

      if (sigBytes1) {
        p1Children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
            children: [
              new ImageRun({
                data: sigBytes1,
                transformation: { width: 140, height: 46 },
                type: 'png',
              }),
            ],
          })
        );
      } else {
        p1Children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: '(Đã ký)',
                italics: true,
                color: '888888',
                font: FONT_NAME,
                size: 20,
              }),
            ],
          })
        );
      }
    } else {
      p1Children.push(new Paragraph({ text: '' }));
    }

    const p2Children: Paragraph[] = [];
    if (p2) {
      p2Children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: p2.name.startsWith('Ông') ? p2.name : `- Ông: ${p2.name}`,
              font: FONT_NAME,
              size: SIZE_MAIN,
            }),
          ],
        })
      );

      if (sigBytes2) {
        p2Children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
            children: [
              new ImageRun({
                data: sigBytes2,
                transformation: { width: 140, height: 46 },
                type: 'png',
              }),
            ],
          })
        );
      } else {
        p2Children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: '(Đã ký)',
                italics: true,
                color: '888888',
                font: FONT_NAME,
                size: 20,
              }),
            ],
          })
        );
      }
    } else {
      p2Children.push(new Paragraph({ text: '' }));
    }

    signatureRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
            children: p1Children,
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellNoBorders,
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
            children: p2Children,
          }),
        ],
      })
    );
  }

  // Manager cell children with embedded signature image
  const managerCellChildren: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: report.signer_title || 'KT. QUẢN ĐỐC',
          bold: true,
          font: FONT_NAME,
          size: SIZE_MAIN,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: report.signer_role || 'PHÓ QUẢN ĐỐC',
          bold: true,
          font: FONT_NAME,
          size: SIZE_MAIN,
        }),
      ],
    }),
  ];

  if (managerSigBytes) {
    managerCellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [
          new ImageRun({
            data: managerSigBytes,
            transformation: { width: 170, height: 56 },
            type: 'png',
          }),
        ],
      })
    );
  } else {
    managerCellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [
          new TextRun({
            text: '(Chữ ký)',
            italics: true,
            color: '888888',
            font: FONT_NAME,
            size: 20,
          }),
        ],
      })
    );
  }

  managerCellChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: report.manager || 'Nguyễn Hoàng Phi',
          bold: true,
          font: FONT_NAME,
          size: SIZE_MAIN,
        }),
      ],
    })
  );

  // Bottom final signature row: Nơi nhận on left, KT. QUẢN ĐỐC on right
  const finalSignRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: cellNoBorders,
        margins: { top: 60, bottom: 40, left: 40, right: 40 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Nơi nhận:', bold: true, italics: true, font: FONT_NAME, size: SIZE_SUB })],
          }),
          new Paragraph({
            children: [new TextRun({ text: '- HCLĐ (để phối hợp);', font: FONT_NAME, size: SIZE_SUB })],
          }),
          new Paragraph({
            children: [new TextRun({ text: '- Lưu: VHIALY.', font: FONT_NAME, size: SIZE_SUB })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: cellNoBorders,
        margins: { top: 60, bottom: 40, left: 40, right: 40 },
        children: managerCellChildren,
      }),
    ],
  });

  const fullSignTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: [...signatureRows, finalSignRow],
  });

  // Process attachments for Word embedding
  const appendix1Children: (Paragraph | Table)[] = [];
  const appendix2Children: (Paragraph | Table)[] = [];
  const attachments = report.attachments || [];
  const imageAttachments = attachments.filter((a) => a.fileType === 'image');
  const pdfAttachments = attachments.filter((a) => a.fileType === 'pdf');

  function cleanDocTitle(fileName: string, description?: string): string {
    const fName = (fileName || '').trim();
    const desc = (description || '').trim();
    const baseName = fName.replace(/\.[^/.]+$/, '').trim();
    if (
      !desc ||
      desc.toLowerCase() === fName.toLowerCase() ||
      desc.toLowerCase() === baseName.toLowerCase() ||
      desc.toLowerCase() === 'hồ sơ đính kèm'
    ) {
      return fName;
    }
    return `${fName} - ${desc}`;
  }

  // Phụ lục 1: Hình ảnh thực tế (4 hình / 1 trang)
  if (imageAttachments.length > 0) {
    appendix1Children.push(
      new Paragraph({
        pageBreakBefore: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({
            text: 'PHỤ LỤC 1: HÌNH ẢNH THỰC TẾ CÔNG TÁC PCCC&CNCH TẠI HIỆN TRƯỜNG',
            bold: true,
            font: FONT_NAME,
            size: SIZE_MAIN,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 140 },
        children: [
          new TextRun({
            text: `(Kèm theo Biên bản tự kiểm tra PCCC&CNCH Tháng ${report.report_month})`,
            italics: true,
            font: FONT_NAME,
            size: SIZE_SUB,
          }),
        ],
      })
    );

    interface LoadedImg {
      bytes: Uint8Array;
      caption: string;
      type: 'png' | 'jpg';
    }
    const loadedImgs: LoadedImg[] = [];
    for (let i = 0; i < imageAttachments.length; i++) {
      const att = imageAttachments[i];
      const fileUrl = attachmentService.getAttachmentViewUrl(att);
      const arrayBuffer = await attachmentService.fetchFileAsArrayBuffer(fileUrl);
      if (arrayBuffer && arrayBuffer.byteLength > 0) {
        loadedImgs.push({
          bytes: new Uint8Array(arrayBuffer),
          caption: `Hình ${i + 1}: ${att.description || att.fileName}`,
          type: att.mimeType?.includes('png') ? 'png' : 'jpg',
        });
      }
    }

    // Chunk loaded images into sets of 4 (4 hình / 1 trang)
    for (let c = 0; c < loadedImgs.length; c += 4) {
      const chunk = loadedImgs.slice(c, c + 4);
      if (c > 0) {
        appendix1Children.push(new Paragraph({ pageBreakBefore: true }));
      }

      const tableRows: TableRow[] = [];
      for (let r = 0; r < 2; r++) {
        const idx1 = r * 2;
        const idx2 = r * 2 + 1;
        if (idx1 >= chunk.length) break;

        const img1 = chunk[idx1];
        const img2 = idx2 < chunk.length ? chunk[idx2] : null;

        const makeCell = (img: LoadedImg | null) => {
          if (!img) {
            return new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              },
              children: [new Paragraph({ text: '' })],
            });
          }

          return new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 20 },
                children: [
                  new ImageRun({
                    data: img.bytes,
                    transformation: { width: 260, height: 180 },
                    type: img.type as any,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 10, after: 50 },
                children: [
                  new TextRun({
                    text: img.caption,
                    bold: true,
                    font: FONT_NAME,
                    size: 20, // 10pt
                  }),
                ],
              }),
            ],
          });
        };

        tableRows.push(
          new TableRow({
            children: [makeCell(img1), makeCell(img2)],
          })
        );
      }

      appendix1Children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          rows: tableRows,
        })
      );
    }
  }

  // Phụ lục 2: Sổ theo dõi phương tiện PCCC & Tài liệu đính kèm (A4 Landscape, thụt đầu dòng)
  if (pdfAttachments.length > 0) {
    appendix2Children.push(
      new Paragraph({
        indent: { firstLine: INDENT_FIRST_LINE },
        spacing: { before: 140, after: 120 },
        children: [
          new TextRun({
            text: 'PHỤ LỤC 2: SỔ THEO DÕI VĂN BẢN, PHƯƠNG TIỆN PCCC & SƠ ĐỒ ĐÍNH KÈM',
            bold: true,
            font: FONT_NAME,
            size: SIZE_MAIN,
          }),
        ],
      })
    );

    const docTableRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 1000, type: WidthType.DXA },
            borders: cellAllBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'STT', bold: true, font: FONT_NAME, size: SIZE_SUB })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 12993, type: WidthType.DXA },
            borders: cellAllBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: 'Tên tài liệu / Văn bản PDF đính kèm', bold: true, font: FONT_NAME, size: SIZE_SUB })],
              }),
            ],
          }),
        ],
      }),
    ];

    for (let pIdx = 0; pIdx < pdfAttachments.length; pIdx++) {
      const pdfAtt = pdfAttachments[pIdx];

      docTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 1000, type: WidthType.DXA },
              borders: cellAllBorders,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${pIdx + 1}`, font: FONT_NAME, size: SIZE_SUB })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 12993, type: WidthType.DXA },
              borders: cellAllBorders,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: pdfAtt.fileName, bold: true, font: FONT_NAME, size: SIZE_SUB })],
                }),
              ],
            }),
          ],
        })
      );
    }

    appendix2Children.push(
      new Table({
        width: { size: 13993, type: WidthType.DXA },
        borders: {
          top: borderThin,
          bottom: borderThin,
          left: borderThin,
          right: borderThin,
          insideHorizontal: borderThin,
          insideVertical: borderThin,
        },
        rows: docTableRows,
      })
    );

    // Embed rendered pages of each PDF (Landscape orientation)
    for (let pIdx = 0; pIdx < pdfAttachments.length; pIdx++) {
      const pdfAtt = pdfAttachments[pIdx];
      const fileUrl = attachmentService.getAttachmentViewUrl(pdfAtt);
      const pdfBuffer = await attachmentService.fetchFileAsArrayBuffer(fileUrl);

      if (pdfBuffer && pdfBuffer.byteLength > 0) {
        const cleanTitle = cleanDocTitle(pdfAtt.fileName, pdfAtt.description);
        appendix2Children.push(
          new Paragraph({
            pageBreakBefore: true,
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 100, after: 60 },
            children: [
              new TextRun({
                text: `Tài liệu ${pIdx + 1}: ${cleanTitle}`,
                bold: true,
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          })
        );

        try {
          const pages = await pdfMergeService.renderPdfPagesToImages(pdfBuffer);
          if (pages && pages.length > 0) {
            for (let i = 0; i < pages.length; i++) {
              const page = pages[i];
              // Scale to fit landscape page nicely: printable area max width 800px, max height 500px
              const maxWidth = 800;
              const maxHeight = 500;
              const scale = Math.min(maxWidth / page.width, maxHeight / page.height);
              const targetWidth = Math.max(200, Math.round(page.width * scale));
              const targetHeight = Math.max(200, Math.round(page.height * scale));

              appendix2Children.push(
                new Paragraph({
                  pageBreakBefore: i > 0,
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 30, after: 20 },
                  children: [
                    new ImageRun({
                      data: page.imageBytes,
                      transformation: { width: targetWidth, height: targetHeight },
                      type: 'png',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 10, after: 40 },
                  children: [
                    new TextRun({
                      text: `Trang ${page.pageNumber} / ${pages.length} - ${pdfAtt.fileName}`,
                      italics: true,
                      font: FONT_NAME,
                      size: SIZE_SUB,
                    }),
                  ],
                })
              );
            }
          } else {
            appendix2Children.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: `(Tài liệu đính kèm: ${pdfAtt.fileName} - Vui lòng xem tệp PDF gốc)`,
                    italics: true,
                    font: FONT_NAME,
                    size: SIZE_SUB,
                  }),
                ],
              })
            );
          }
        } catch (e) {
          console.error(`Could not render PDF pages for ${pdfAtt.fileName}:`, e);
          appendix2Children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: `(Tài liệu đính kèm: ${pdfAtt.fileName} - Vui lòng xem tệp PDF gốc)`,
                  italics: true,
                  font: FONT_NAME,
                  size: SIZE_SUB,
                }),
              ],
            })
          );
        }
      } else {
        console.warn(`Could not load buffer for PDF attachment: ${pdfAtt.fileName}`);
      }
    }
  }

  // Create Document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_NAME,
            size: SIZE_MAIN,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: MARGIN_TOP, // 2.0 cm (1134 dxa)
              bottom: MARGIN_BOTTOM, // 2.0 cm (1134 dxa)
              left: MARGIN_LEFT, // 3.0 cm (1701 dxa)
              right: MARGIN_RIGHT, // 2.0 cm (1134 dxa)
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'Mẫu số PC02', italics: true, font: FONT_NAME, size: SIZE_SUB })],
          }),
          headerTable,
          new Paragraph({ text: '', spacing: { before: 100 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'BIÊN BẢN TỰ KIỂM TRA',
                bold: true,
                font: FONT_NAME,
                size: SIZE_TITLE,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: `Về phòng cháy, chữa cháy tháng ${report.report_month}`,
                bold: true,
                font: FONT_NAME,
                size: SIZE_TITLE,
              }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: `Hồi ${report.start_h} giờ ${report.start_p} phút, ngày ${report.start_day} tháng ${report.start_month} năm ${report.start_year}`,
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: 'Chúng tôi gồm:', bold: true, font: FONT_NAME, size: SIZE_MAIN })],
          }),
          peopleTable,
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 80, after: 40 },
            children: [new TextRun({ text: 'Đã tiến hành kiểm tra công tác PCCC&CNCH tại các khu vực sau:', font: FONT_NAME, size: SIZE_MAIN })],
          }),
          ...areaParagraphs,
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 120, after: 60 },
            children: [new TextRun({ text: 'I. Nội dung và kết quả kiểm tra như sau', bold: true, font: FONT_NAME, size: SIZE_MAIN })],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: '1. Duy trì hoạt động các phương tiện, hệ thống phòng cháy, chữa cháy, cứu nạn, cứu hộ, hệ thống điện phục vụ phòng cháy và chữa cháy; nguồn nước chữa cháy.',
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          equipTable,
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 80, after: 120 },
            children: [
              new TextRun({
                text: `Ghi chú: ${report.equip_note || 'Thống kê chi tiết trang bị và duy trì các phương tiện, dụng cụ, hệ thống nêu trên như Phụ lục kèm theo biên bản này.'}`,
                italics: true,
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: '2. Duy trì điều kiện an toàn phòng cháy trong sử dụng nguồn lửa, nguồn nhiệt, thiết bị, dụng cụ sinh lửa, sinh nhiệt, chất dễ cháy, nổ.',
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          fireTable,
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: '3. Duy trì giải pháp thoát nạn, ngăn cháy, chống cháy lan, chống khói.',
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          escapeTable,
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: '4. Chấp hành nội quy phòng cháy, chữa cháy, cứu hộ, cứu nạn',
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 40, after: 80 },
            children: [new TextRun({ text: report.compliance, font: FONT_NAME, size: SIZE_MAIN })],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({ text: 'II. Kiến nghị: ', bold: true, font: FONT_NAME, size: SIZE_MAIN }),
              new TextRun({ text: report.recommendations.join(' '), font: FONT_NAME, size: SIZE_MAIN }),
            ],
          }),
          new Paragraph({
            indent: { firstLine: INDENT_FIRST_LINE },
            spacing: { before: 80, after: 120 },
            children: [
              new TextRun({
                text: `Biên bản kết thúc lúc ${report.end_h} giờ ${report.end_p} phút cùng ngày./.`,
                italics: true,
                font: FONT_NAME,
                size: SIZE_MAIN,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [new TextRun({ text: 'Các thành viên kiểm tra:', bold: true, font: FONT_NAME, size: SIZE_MAIN })],
          }),
          fullSignTable,
          ...appendix1Children,
        ],
      },
      ...(appendix2Children.length > 0
        ? [
            {
              properties: {
                page: {
                  size: {
                    orientation: PageOrientation.LANDSCAPE,
                    width: 11906, // Note: docx swaps width and height when orientation is LANDSCAPE to produce w:w="16838" w:h="11906" (297mm x 210mm)
                    height: 16838,
                  },
                  margin: {
                    left: MARGIN_LEFT, // 3.0 cm (theo trái 3cm)
                    top: MARGIN_TOP, // 2.0 cm (trên 2cm)
                    bottom: MARGIN_BOTTOM, // 2.0 cm (dưới 2cm)
                    right: MARGIN_RIGHT, // 2.0 cm (phải 2cm)
                  },
                },
              },
              children: appendix2Children,
            },
          ]
        : []),
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeMonth = (report.report_month || 'T_').replace(/[^0-9A-Za-z_-]/g, '_');
  const filename = `VHIALY_Bien_ban_tu_kiem_tra_PCCC_CNCH_${safeMonth}.docx`;
  saveAs(blob, filename);
}
