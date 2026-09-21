import React from 'react';
import { ReportData } from '../types';
import { getSignatureForPerson } from '../data/sampleSignatures';
import { attachmentService } from '../services/attachmentService';

interface DocumentA4ContentProps {
  report: ReportData;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const DocumentA4Content: React.FC<DocumentA4ContentProps> = ({
  report,
  id = 'print-document',
  className = '',
  style = {},
}) => {
  const memberSigners = report.people.filter(
    (p) => p.name.trim() && p.name.trim() !== report.manager.trim()
  );

  const numRows = Math.ceil(memberSigners.length / 2);

  return (
    <div
      id={id}
      className={`bg-white text-black shadow-2xl w-[210mm] min-h-[297mm] font-serif leading-[1.4] text-[13pt] print:shadow-none print:w-full print:p-0 ${className}`}
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        padding: '20mm 20mm 20mm 30mm', // Top 20mm, Right 20mm, Bottom 20mm, Left 30mm
        ...style,
      }}
    >
      {/* Top Form Code */}
      <div className="text-right italic text-[11pt] mb-1">
        Mẫu số PC02
      </div>

      {/* Header 2 columns */}
      <div className="grid grid-cols-2 gap-4 pb-2">
        {/* Left: Organization */}
        <div className="text-center">
          <div className="font-bold text-[11.5pt] uppercase leading-snug">
            CÔNG TY THỦY ĐIỆN IALY
          </div>
          <div className="font-bold text-[11.5pt] uppercase underline decoration-1 underline-offset-4 leading-snug">
            PX VẬN HÀNH IALY
          </div>
          <div className="mt-2 text-[12pt]">
            Số: {report.so || '.../VHIALY'}
          </div>
        </div>

        {/* Right: Country Header */}
        <div className="text-center">
          <div className="font-bold text-[11.5pt] uppercase leading-snug">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </div>
          <div className="font-bold text-[11.5pt] underline decoration-1 underline-offset-4 leading-snug">
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div className="mt-2 italic text-[12pt]">
            {report.place || 'Gia Lai'}, ngày {report.header_day} tháng {report.header_month} năm {report.header_year}
          </div>
        </div>
      </div>

      {/* Document Title */}
      <div className="text-center mt-5 mb-4">
        <h1 className="font-bold text-[14pt] uppercase tracking-wide">
          BIÊN BẢN TỰ KIỂM TRA
        </h1>
        <h2 className="font-bold text-[13.5pt] mt-0.5">
          Về phòng cháy, chữa cháy tháng {report.report_month}
        </h2>
      </div>

      {/* Inspection Start Time */}
      <p className="mb-2" style={{ textIndent: '1.2cm' }}>
        Hồi {report.start_h} giờ {report.start_p} phút, ngày {report.start_day} tháng {report.start_month} năm {report.start_year}
      </p>

      {/* Attendees - 2 Columns (Tên 40% và Chức vụ 60%) */}
      <p className="font-bold mb-1" style={{ textIndent: '1.2cm' }}>Chúng tôi gồm:</p>
      <table className="w-full mb-3 text-[12pt] border-none border-collapse">
        <tbody>
          {report.people.map((p) => {
            const nameClean = p.name.trim().replace(/^-\s*/, '');
            const displayName = nameClean.toLowerCase().startsWith('ông')
              ? `- ${nameClean}`
              : `- Ông: ${nameClean}`;
            const roleClean = p.role.trim();
            const displayRole = roleClean.toLowerCase().startsWith('chức vụ:')
              ? roleClean
              : `Chức vụ: ${roleClean}`;

            return (
              <tr key={p.id} className="border-none">
                <td className="w-[40%] pl-[0.8cm] py-0.5 border-none align-top text-left font-normal whitespace-nowrap">
                  {displayName}
                </td>
                <td className="w-[60%] py-0.5 border-none align-top text-left font-normal whitespace-nowrap">
                  {displayRole}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Inspection Areas */}
      <p className="mt-2 mb-1" style={{ textIndent: '1.2cm' }}>
        Đã tiến hành kiểm tra công tác PCCC&CNCH tại các khu vực sau:
      </p>
      <div className="pl-[1.2cm] whitespace-pre-line mb-3">
        {report.inspection_areas}
      </div>

      {/* Main Content Section */}
      <div className="font-bold text-[13pt] mt-4 mb-2" style={{ textIndent: '1.2cm' }}>
        I. Nội dung và kết quả kiểm tra như sau
      </div>

      {/* Sub-section 1 */}
      <div className="mb-2 text-[13pt]" style={{ textIndent: '1.2cm' }}>
        1. Duy trì hoạt động các phương tiện, hệ thống phòng cháy, chữa cháy, cứu nạn, cứu hộ, hệ thống điện phục vụ phòng cháy và chữa cháy; nguồn nước chữa cháy.
      </div>

      {/* Table 1: Equipment */}
      <table className="w-full border-collapse border border-black text-[11.5pt] mb-2">
        <thead>
          <tr className="bg-[#eef2f5] text-center font-bold">
            <th rowSpan={2} className="border border-black px-1.5 py-1 w-[8%]">STT</th>
            <th rowSpan={2} className="border border-black px-2 py-1 w-[44%] text-left">Tên trang bị phương tiện, hệ thống</th>
            <th rowSpan={2} className="border border-black px-1.5 py-1 w-[12%]">Số lượng</th>
            <th colSpan={2} className="border border-black px-1.5 py-0.5 w-[22%]">Tình trạng</th>
            <th rowSpan={2} className="border border-black px-1.5 py-1 w-[14%]">Ghi chú</th>
          </tr>
          <tr className="bg-[#eef2f5] text-center font-bold">
            <th className="border border-black px-1 py-0.5 w-[11%]">Đạt</th>
            <th className="border border-black px-1 py-0.5 w-[11%]">Không đạt</th>
          </tr>
        </thead>
        <tbody>
          {report.equip.map((eq) => {
            if (eq.isHeader || ['I', 'II', 'III', 'IV'].includes(eq.stt.trim())) {
              return (
                <tr key={eq.id} className="font-bold">
                  <td className="border border-black px-1.5 py-1 text-center">{eq.stt}</td>
                  <td colSpan={5} className="border border-black px-2 py-1">{eq.name}</td>
                </tr>
              );
            }

            return (
              <tr key={eq.id}>
                <td className="border border-black px-1 py-1 text-center">{eq.stt}</td>
                <td className="border border-black px-2 py-1">{eq.name}</td>
                <td className="border border-black px-1 py-1 text-center italic">{eq.qty}</td>
                <td className="border border-black px-1 py-1 text-center italic">{eq.ok}</td>
                <td className="border border-black px-1 py-1 text-center italic">{eq.bad}</td>
                <td className="border border-black px-1.5 py-1 text-left">{eq.note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Equip Note */}
      <div className="italic text-[12pt] mb-4" style={{ textIndent: '1.2cm' }}>
        Ghi chú: {report.equip_note}
      </div>

      {/* Sub-section 2 */}
      <div className="mb-2 text-[13pt]" style={{ textIndent: '1.2cm' }}>
        2. Duy trì điều kiện an toàn phòng cháy trong sử dụng nguồn lửa, nguồn nhiệt, thiết bị, dụng cụ sinh lửa, sinh nhiệt, chất dễ cháy, nổ.
      </div>

      {/* Table 2: Fire Safety */}
      <table className="w-full border-collapse border border-black text-[11.5pt] mb-4">
        <thead>
          <tr className="bg-[#eef2f5] text-center font-bold">
            <th rowSpan={2} className="border border-black px-1.5 py-1 w-[8%]">STT</th>
            <th rowSpan={2} className="border border-black px-2 py-1 w-[40%] text-left">Nội dung duy trì</th>
            <th rowSpan={2} className="border border-black px-2 py-1 w-[26%] text-left">Số lượng</th>
            <th colSpan={2} className="border border-black px-1 py-0.5 w-[16%]">Tình trạng</th>
            <th rowSpan={2} className="border border-black px-1.5 py-1 w-[10%]">Ghi chú</th>
          </tr>
          <tr className="bg-[#eef2f5] text-center font-bold">
            <th className="border border-black px-1 py-0.5 w-[8%]">Đảm bảo</th>
            <th className="border border-black px-1 py-0.5 w-[8%]">Không đảm bảo</th>
          </tr>
        </thead>
        <tbody>
          {report.fire.map((f) => (
            <tr key={f.id}>
              <td className="border border-black px-1 py-1 text-center align-top">{f.stt}</td>
              <td className="border border-black px-2 py-1 align-top">{f.name}</td>
              <td className="border border-black px-2 py-1 align-top whitespace-pre-line italic">
                {f.qty}
              </td>
              <td className="border border-black px-1 py-1 text-center align-top italic">{f.ok}</td>
              <td className="border border-black px-1 py-1 text-center align-top italic">{f.bad}</td>
              <td className="border border-black px-1.5 py-1 align-top">{f.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sub-section 3 */}
      <div className="mb-2 text-[13pt]" style={{ textIndent: '1.2cm' }}>
        3. Duy trì giải pháp thoát nạn, ngăn cháy, chống cháy lan, chống khói.
      </div>

      {/* Table 3: Escape */}
      <table className="w-full border-collapse border border-black text-[11.5pt] mb-4">
        <thead>
          <tr className="bg-[#eef2f5] text-center font-bold">
            <th className="border border-black px-1.5 py-1 w-[8%]">STT</th>
            <th className="border border-black px-2 py-1 w-[44%] text-left">Nội dung duy trì</th>
            <th className="border border-black px-2 py-1 w-[16%]">Tình trạng</th>
            <th className="border border-black px-2 py-1 w-[32%] text-left">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {report.escape.map((esc) => (
            <tr key={esc.id}>
              <td className="border border-black px-1 py-1 text-center">{esc.stt}</td>
              <td className="border border-black px-2 py-1">{esc.name}</td>
              <td className="border border-black px-1 py-1 text-center italic">{esc.status}</td>
              <td className="border border-black px-2 py-1 text-[10.5pt]">{esc.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sub-section 4: Compliance */}
      <div className="mb-1 text-[13pt]" style={{ textIndent: '1.2cm' }}>
        4. Chấp hành nội quy phòng cháy, chữa cháy, cứu hộ, cứu nạn
      </div>
      <p className="mb-3 text-[13pt]" style={{ textIndent: '1.2cm' }}>
        {report.compliance}
      </p>

      {/* Section II: Recommendations */}
      <div className="mb-3 text-[13pt]" style={{ textIndent: '1.2cm' }}>
        <span className="font-bold">II. Kiến nghị: </span>
        <span>{report.recommendations.join(' ')}</span>
      </div>

      {/* Concluding Time */}
      <p className="italic text-[13pt] mb-4" style={{ textIndent: '1.2cm' }}>
        Biên bản kết thúc lúc {report.end_h} giờ {report.end_p} phút cùng ngày./.
      </p>

      {/* Signatures Header */}
      <div className="text-center font-bold text-[13pt] mb-3">
        Các thành viên kiểm tra:
      </div>

      {/* 2-Column Signatures Grid matching original document */}
      <div className="space-y-4 mb-6">
        {Array.from({ length: numRows }).map((_, rIdx) => {
          const p1 = memberSigners[rIdx * 2];
          const p2 = memberSigners[rIdx * 2 + 1];

          return (
            <div key={rIdx} className="grid grid-cols-2 gap-6 min-h-[90px]">
              {/* Left Column */}
              {p1 ? (
                <div className="flex flex-col items-center">
                  <div className="text-center">- Ông: {p1.name}</div>
                  <div className="h-14 flex items-center justify-center my-1">
                    {getSignatureForPerson(p1.name, p1.signatureImage) ? (
                      <img
                        src={getSignatureForPerson(p1.name, p1.signatureImage)!}
                        alt={`Chữ ký ${p1.name}`}
                        className="max-h-12 max-w-[170px] object-contain"
                      />
                    ) : (
                      <div className="text-slate-300 italic text-xs h-10 flex items-center">
                        (Đã ký)
                      </div>
                    )}
                  </div>
                </div>
              ) : <div />}

              {/* Right Column */}
              {p2 ? (
                <div className="flex flex-col items-center">
                  <div className="text-center">
                    {p2.name.startsWith('Ông') ? p2.name : `- Ông: ${p2.name}`}
                  </div>
                  <div className="h-14 flex items-center justify-center my-1">
                    {getSignatureForPerson(p2.name, p2.signatureImage) ? (
                      <img
                        src={getSignatureForPerson(p2.name, p2.signatureImage)!}
                        alt={`Chữ ký ${p2.name}`}
                        className="max-h-12 max-w-[170px] object-contain"
                      />
                    ) : (
                      <div className="text-slate-300 italic text-xs h-10 flex items-center">
                        (Đã ký)
                      </div>
                    )}
                  </div>
                </div>
              ) : <div />}
            </div>
          );
        })}
      </div>

      {/* Bottom Signatures: Nơi nhận & Quản đốc */}
      <div className="grid grid-cols-2 gap-6 pt-4">
        {/* Nơi nhận */}
        <div className="text-[10pt] leading-tight">
          <div className="font-bold italic">Nơi nhận:</div>
          <div>- HCLĐ (để phối hợp);</div>
          <div>- Lưu: VHIALY.</div>
        </div>

        {/* Manager Signature */}
        <div className="text-center">
          <div className="font-bold uppercase text-[12.5pt] leading-snug">
            {report.signer_title || 'KT. QUẢN ĐỐC'}
          </div>
          <div className="font-bold uppercase text-[12.5pt] leading-snug">
            {report.signer_role || 'PHÓ QUẢN ĐỐC'}
          </div>
          <div className="h-20 flex items-center justify-center my-1">
            {getSignatureForPerson(report.manager, report.manager_signature) ? (
              <img
                src={getSignatureForPerson(report.manager, report.manager_signature)!}
                alt={`Chữ ký ${report.manager}`}
                className="max-h-16 max-w-[200px] object-contain"
              />
            ) : (
              <div className="text-slate-300 italic text-xs">
                (Chữ ký)
              </div>
            )}
          </div>
          <div className="font-bold text-[13pt]">
            {report.manager}
          </div>
        </div>
      </div>

      {/* ================= PHỤ LỤC HÌNH ẢNH & TÀI LIỆU ================= */}
      {report.attachments && report.attachments.length > 0 && (
        <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-300 print:break-before-page">
          <div className="text-center mb-6">
            <div className="font-bold text-[14pt] uppercase">
              PHỤ LỤC: HÌNH ẢNH & TÀI LIỆU KIỂM TRA HIỆN TRƯỜNG
            </div>
            <div className="italic text-[11pt] text-slate-600">
              (Kèm theo Biên bản tự kiểm tra PCCC&CNCH Tháng {report.report_month})
            </div>
          </div>

          {/* Image Attachments (4 images per page) */}
          {(report.attachments || []).filter((a) => a.fileType === 'image').length > 0 && (
            <div className="mb-8">
              <div className="font-bold text-[12.5pt] mb-4 text-[#17365d] border-b pb-1">
                PHỤ LỤC 1: HÌNH ẢNH THỰC TẾ CÔNG TÁC PCCC&CNCH TẠI HIỆN TRƯỜNG
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(report.attachments || [])
                  .filter((a) => a.fileType === 'image')
                  .map((imgAtt, idx) => {
                    const src = attachmentService.getAttachmentViewUrl(imgAtt);
                    return (
                      <div
                        key={imgAtt.id}
                        className="border border-slate-300 rounded p-2 bg-slate-50/50 flex flex-col justify-between text-[10.5pt]"
                      >
                        <div className="aspect-[4/3] bg-black/5 overflow-hidden rounded mb-1.5 flex items-center justify-center">
                          <img
                            src={src}
                            alt={imgAtt.description || imgAtt.fileName}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                          />
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-[10.5pt]">
                            Hình {idx + 1}: {imgAtt.description || imgAtt.fileName}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Phụ lục 2: A4 Landscape, Thụt đầu dòng, Lề: Trái 3cm, Trên/Dưới/Phải 2cm */}
          {(report.attachments || []).filter((a) => a.fileType === 'pdf').length > 0 && (
            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-300 print:break-before-page">
              <div className="bg-white border border-slate-300 rounded-lg p-6 sm:p-8 shadow-xs">
                <div
                  className="font-bold text-[13pt] mb-3 text-[#17365d] border-b pb-2"
                  style={{ textIndent: '1.27cm' }}
                >
                  PHỤ LỤC 2: SỔ THEO DÕI PHƯƠNG TIỆN PCCC, VĂN BẢN & SƠ ĐỒ ĐÍNH KÈM
                </div>

                <table className="w-full border-collapse border border-black text-[10.5pt]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black px-2 py-1.5 w-12 text-center">STT</th>
                      <th className="border border-black px-3 py-1.5 text-left">Tên tài liệu / Văn bản PDF đính kèm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.attachments || [])
                      .filter((a) => a.fileType === 'pdf')
                      .map((pdfAtt, pIdx) => (
                        <tr key={pdfAtt.id}>
                          <td className="border border-black px-2 py-2 text-center">{pIdx + 1}</td>
                          <td className="border border-black px-3 py-2 font-bold">{pdfAtt.fileName}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
