import { GoogleGenAI } from '@google/genai';
import { AiInspectionAnalysis } from '../types';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

export async function analyzeInspectionImageWithGemini(params: {
  imageBase64: string;
  mimeType: string;
  targetCategory?: string;
  plant?: 'ialy' | 'ialy_mr';
  locationDescription?: string;
  userDescription?: string;
}): Promise<AiInspectionAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: 'failed',
      detectedItems: [],
      complianceStatus: 'warning',
      findings: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.',
      recommendation: 'Vui lòng bổ sung GEMINI_API_KEY vào biến môi trường để sử dụng tính năng AI Vision.',
      description: params.userDescription || 'Ảnh kiểm tra hiện trường PCCC',
      analyzedAt: new Date().toISOString(),
    };
  }

  const ai = getGenAI();
  const plantName = params.plant === 'ialy_mr' ? 'Nhà máy Thủy điện Ialy Mở rộng (Ialy MR)' : 'Nhà máy Thủy điện Ialy';
  const category = params.targetCategory || 'Thiết bị / Khu vực PCCC';
  const location = params.locationDescription || 'Khu vực công trình thủy điện';

  const prompt = `Bạn là Chuyên gia Kỹ thuật An toàn Phòng cháy chữa cháy & Cứu nạn cứu hộ (PCCC&CNCH) của Công ty Thủy điện Ialy.
Hãy phân tích bức ảnh hiện trường kiểm tra PCCC tại ${plantName}.
Hạng mục kiểm tra: ${category}
Vị trí: ${location}
Ghi chú thêm: ${params.userDescription || 'Không có'}

Quy chuẩn và tiêu chuẩn áp dụng: TCVN 3890, QCVN 06:2022/BXD, Nghị định 136/2020/NĐ-CP và Nghị định 50/2024/NĐ-CP.
Các đối tượng trọng tâm cần quan sát:
1. Bình chữa cháy (bột, khí CO2): Đồng hồ áp suất (kim xanh/đỏ/vàng), chốt hãm kẹp chì, vòi loa phun, rỉ sét, tem kiểm định, vị trí treo/đặt đúng chiều cao.
2. Cầu thang thoát nạn, lối thoát nạn, cửa thoát nạn: Có bị đồ đạc, vật tư cản trở không, cửa chống cháy có đóng kín không, tay nắm/thanh đẩy panic hoạt động bình thường không.
3. Biển EXIT và đèn chiếu sáng sự cố: Đèn có sáng không, biển báo có bị mờ, che khuất hoặc bong tróc không.
4. Tủ/họng nước chữa cháy: Đủ lăng, vòi, van không, cuộn vòi có bị mục rách không, van có rò rỉ nước không, trước tủ có bị chướng ngại vật cản trở thao tác không.
5. Bãi đậu xe, đường giao thông phục vụ chữa cháy: Chiều rộng đường xe cứu hỏa, có bị xe đậu lấn chiếm hoặc chướng ngại vật cản trở đường tiếp cận không.
6. Nguy cơ nguồn nhiệt, nguồn lửa: Dây dẫn điện chắp vá, quá tải, thiết bị sinh nhiệt gần chất dễ cháy, công tác hàn mài không che chắn.

Hãy phân tích kỹ bức ảnh và trả về DUY NHẤT một JSON theo cấu trúc sau (không bọc trong markdown code block, không thêm lời dẫn):
{
  "detectedItems": ["tên các thiết bị/khu vực nhận diện được"],
  "complianceStatus": "pass" hoặc "fail" hoặc "warning",
  "findings": "Mô tả chi tiết tình trạng quan sát được, các điểm bất thường hoặc khuyết tật kỹ thuật phát hiện được",
  "recommendation": "Đề xuất biện pháp xử lý, khắc phục cụ thể theo quy chuẩn PCCC",
  "observedConditions": "Tình trạng bề mặt, môi trường xung quanh, vị trí bố trí",
  "potentialAnomalies": "Bất thường tiềm ẩn hoặc nguy cơ rủi ro mất an toàn",
  "pointsToCheck": "Điểm cần thành viên đoàn kiểm tra tiếp tục lưu ý theo dõi",
  "description": "Mô tả súc tích nội dung hình ảnh để đưa vào phụ lục báo cáo"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: params.mimeType,
                data: params.imageBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '';
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      status: 'completed',
      detectedItems: Array.isArray(parsed.detectedItems) ? parsed.detectedItems : [category],
      complianceStatus: ['pass', 'fail', 'warning'].includes(parsed.complianceStatus) ? parsed.complianceStatus : 'warning',
      findings: parsed.findings || 'Đã phân tích hiện trường.',
      recommendation: parsed.recommendation || 'Tiếp tục duy trì kiểm tra định kỳ.',
      observedConditions: parsed.observedConditions || '',
      potentialAnomalies: parsed.potentialAnomalies || '',
      pointsToCheck: parsed.pointsToCheck || '',
      description: parsed.description || params.userDescription || `${category} tại ${location}`,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Gemini Vision analysis error:', error);
    return {
      status: 'failed',
      detectedItems: [category],
      complianceStatus: 'warning',
      findings: `Lỗi trong quá trình phân tích hình ảnh: ${error?.message || 'Không thể kết nối dịch vụ AI'}`,
      recommendation: 'Vui lòng kiểm tra lại ảnh chụp hoặc thử lại.',
      description: params.userDescription || `${category} - ${location}`,
      analyzedAt: new Date().toISOString(),
    };
  }
}
