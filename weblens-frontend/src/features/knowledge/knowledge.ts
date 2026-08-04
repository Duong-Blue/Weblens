export interface KnowledgeArticle {
  slug: string;
  metric: string;
  title: string;
  summary: string;
  causes: string[];
  optimize: string[];
  examples: string[];
}

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    slug: 'lcp',
    metric: 'LCP (Largest Contentful Paint)',
    title: 'Hiệu suất hiển thị nội dung chính',
    summary: 'LCP đo lường thời gian cần thiết để phần tử nội dung lớn nhất (thường là hình ảnh, video hoặc khối văn bản) hiển thị trên màn hình. Website tải chậm do ảnh hero quá lớn hoặc server phản hồi chậm sẽ dẫn đến LCP kém, ảnh hưởng trực tiếp đến trải nghiệm người dùng ngay từ giây đầu tiên.',
    causes: [
      'Máy chủ phản hồi chậm (TTFB cao)',
      'Tài nguyên cản trở quá trình render (JavaScript/CSS đồng bộ)',
      'Hình ảnh hero kích thước quá lớn, chưa được tối ưu hoặc nén',
      'Phần tử LCP được tải trễ do render bằng JavaScript phía client'
    ],
    optimize: [
      'Nén và sử dụng định dạng ảnh hiện đại (WebP, AVIF) cho ảnh hero',
      'Preload hình ảnh lớn nhất hoặc font chữ quan trọng',
      'Loại bỏ JS/CSS chặn render ở đầu trang',
      'Sử dụng CDN hoặc bộ nhớ đệm (cache) để cải thiện thời gian phản hồi máy chủ'
    ],
    examples: [
      'Website tải chậm do ảnh hero quá lớn, chưa được nén dung lượng, dẫn đến LCP lên tới 4.5s.',
      'Font chữ web chưa tối ưu khiến khối lượng văn bản lớn nhất bị ẩn (FOIT) cho đến khi font tải xong.',
      'Ví dụ đúng: Chuyển đổi thành WebP 150KB, thêm thuộc tính fetchpriority="high", giảm LCP xuống còn 1.2 giây.'
    ]
  },
  {
    slug: 'inp',
    metric: 'INP (Interaction to Next Paint)',
    title: 'Độ trễ tương tác',
    summary: 'INP đo lường thời gian từ lúc người dùng tương tác (click, tap, nhấn phím) đến khi giao diện phản hồi bằng một khung hình mới. INP kém thường do JavaScript chạy quá lâu trên luồng chính.',
    causes: [
      'Các tác vụ JavaScript kéo dài (Long Tasks) chặn luồng chính',
      'Sự kiện event listeners xử lý quá phức tạp và chậm trễ',
      'Xử lý DOM hoặc re-render giao diện quá lớn (ví dụ trong React)'
    ],
    optimize: [
      'Chia nhỏ các tác vụ JavaScript dài thành các phần nhỏ gọn hơn (sử dụng setTimeout hoặc requestIdleCallback)',
      'Trì hoãn tải mã JavaScript không cần thiết (Lazy load)',
      'Tối ưu hóa các framework xử lý re-render'
    ],
    examples: [
      'Giao diện bị "treo" nửa giây khi người dùng bấm nút thêm vào giỏ hàng do script xử lý dữ liệu quá nặng.'
    ]
  },
  {
    slug: 'cls',
    metric: 'CLS (Cumulative Layout Shift)',
    title: 'Độ ổn định bố cục',
    summary: 'CLS đo lường mức độ các thành phần trên trang bị dịch chuyển bất ngờ trong quá trình tải trang. Điều này thường làm người dùng bấm nhầm nút.',
    causes: [
      'Hình ảnh hoặc video không có thuộc tính kích thước width/height',
      'Quảng cáo, iframes được chèn tự động thay đổi kích thước',
      'Font chữ tải muộn gây ra hiện tượng FOIT/FOUT (thay đổi kích thước chữ)',
      'Nội dung được tiêm bằng JavaScript đẩy các phần tử khác xuống'
    ],
    optimize: [
      'Luôn khai báo thuộc tính width và height cho hình ảnh, video',
      'Dự trữ không gian (placeholder) cho các khung quảng cáo hoặc iframe',
      'Tối ưu quá trình tải font (sử dụng font-display: optional hoặc fallback font gần giống)'
    ],
    examples: [
      'Đang đọc báo, một banner quảng cáo đột nhiên tải xong đẩy nội dung xuống dưới khiến bạn bấm nhầm vào đường dẫn khác.'
    ]
  },
  {
    slug: 'ttfb',
    metric: 'TTFB (Time to First Byte)',
    title: 'Thời gian phản hồi máy chủ',
    summary: 'Thời gian để trình duyệt nhận được byte dữ liệu đầu tiên từ máy chủ. TTFB chậm ảnh hưởng trực tiếp đến tất cả các chỉ số khác.',
    causes: [
      'Cấu hình máy chủ chưa tối ưu hoặc thiếu tài nguyên phần cứng',
      'Truy vấn cơ sở dữ liệu chậm hoặc thiếu cache',
      'Khoảng cách vật lý từ máy chủ đến người dùng quá xa'
    ],
    optimize: [
      'Sử dụng Mạng phân phối nội dung (CDN)',
      'Bật cơ chế caching tĩnh và động trên máy chủ',
      'Tối ưu hóa các câu truy vấn cơ sở dữ liệu'
    ],
    examples: [
      'Máy chủ mất 1.5 giây chỉ để truy xuất cơ sở dữ liệu trước khi gửi đi mã HTML đầu tiên.'
    ]
  },
  {
    slug: 'tbt',
    metric: 'TBT (Total Blocking Time)',
    title: 'Tổng thời gian chặn',
    summary: 'TBT tính tổng thời gian mà luồng chính bị chặn bởi các tác vụ dài (Long Tasks) giữa FCP và TTI, khiến trang web không thể phản hồi tương tác người dùng.',
    causes: [
      'Khối lượng mã JavaScript bên thứ ba quá lớn (Analytics, Ads)',
      'Phân tích cú pháp và thực thi JavaScript quá phức tạp',
      'DOM có quá nhiều node (vượt quá 1500 node)'
    ],
    optimize: [
      'Loại bỏ hoặc tải trễ các script bên thứ ba không cần thiết',
      'Giảm độ phức tạp của JavaScript trong lần tải đầu tiên',
      'Tối giản số lượng thẻ HTML (DOM nodes)'
    ],
    examples: [
      'Sau khi trang hiện ra, người dùng phải chờ 2 giây mới có thể cuộn chuột vì trình duyệt bận xử lý script chat.'
    ]
  },
  {
    slug: 'seo-title',
    metric: 'SEO: Thẻ tiêu đề',
    title: 'Tối ưu hóa tiêu đề trang',
    summary: 'Thẻ <title> là yếu tố xếp hạng quan trọng nhất của SEO On-page. Nó hiển thị trên kết quả tìm kiếm và tiêu đề của tab trình duyệt.',
    causes: [
      'Thiếu thẻ title hoặc thẻ title trống',
      'Tiêu đề quá ngắn, quá dài (trên 60 ký tự) hoặc trùng lặp giữa các trang'
    ],
    optimize: [
      'Viết tiêu đề súc tích, độ dài 50-60 ký tự',
      'Chứa từ khóa chính ở phần đầu, đảm bảo tính duy nhất cho mỗi trang'
    ],
    examples: [
      'Tốt: "Giày Thể Thao Nam Chính Hãng, Giảm Giá 20% | TênCửaHàng"'
    ]
  },
  {
    slug: 'seo-meta',
    metric: 'SEO: Meta Description',
    title: 'Mô tả Meta cho kết quả tìm kiếm',
    summary: 'Mô tả meta cung cấp tóm tắt ngắn về nội dung trang. Dù không phải yếu tố xếp hạng trực tiếp, nó quyết định tỷ lệ nhấp chuột (CTR) của người dùng.',
    causes: [
      'Thiếu thẻ meta description',
      'Mô tả nhồi nhét quá nhiều từ khóa hoặc vượt quá 160 ký tự'
    ],
    optimize: [
      'Viết đoạn mô tả hấp dẫn chứa lời kêu gọi hành động (CTA), giới hạn khoảng 150-160 ký tự',
      'Đảm bảo nội dung khớp với ý định tìm kiếm của người dùng'
    ],
    examples: [
      'Mô tả thiếu thu hút khiến người dùng bỏ qua trang web của bạn trên Google dù xếp hạng cao.'
    ]
  },
  {
    slug: 'seo-jsonld',
    metric: 'SEO: Cấu trúc dữ liệu',
    title: 'Dữ liệu có cấu trúc (Schema Markup)',
    summary: 'Đoạn mã JSON-LD giúp các công cụ tìm kiếm hiểu rõ hơn về nội dung trang và có thể hiển thị kết quả phong phú (Rich Snippets) như sao đánh giá, giá bán.',
    causes: [
      'Trang web thiếu dữ liệu có cấu trúc',
      'Cấu hình mã JSON-LD bị lỗi cú pháp'
    ],
    optimize: [
      'Thêm Schema phù hợp (Product, Article, LocalBusiness) vào trang',
      'Kiểm tra bằng công cụ Rich Results Test của Google'
    ],
    examples: [
      'Sản phẩm hiện trên Google với số sao đánh giá 5/5 và giá bán, thu hút nhiều lượt click hơn.'
    ]
  },
  {
    slug: 'wcag-img-alt',
    metric: 'Accessibility: Thuộc tính alt ảnh',
    title: 'Văn bản thay thế cho hình ảnh',
    summary: 'Thuộc tính alt mô tả hình ảnh cho người khiếm thị dùng trình đọc màn hình, đồng thời giúp bot Google hiểu nội dung hình ảnh.',
    causes: [
      'Quên thêm thuộc tính alt cho các thẻ <img>',
      'Dùng alt="image" hoặc "anh123.jpg" không có ý nghĩa'
    ],
    optimize: [
      'Viết mô tả ngắn gọn, chính xác về những gì xuất hiện trong ảnh',
      'Nếu ảnh chỉ để trang trí, dùng alt="" để trình đọc màn hình bỏ qua'
    ],
    examples: [
      'Thay vì alt="", dùng alt="Người đàn ông mặc áo khoác đỏ đang chạy bộ trong công viên".'
    ]
  },
  {
    slug: 'security-hsts',
    metric: 'Security: HSTS',
    title: 'Strict-Transport-Security (HSTS)',
    summary: 'HSTS bắt buộc trình duyệt luôn kết nối với trang web qua HTTPS, bảo vệ người dùng khỏi các cuộc tấn công hạ cấp kết nối.',
    causes: [
      'Chưa cấu hình header Strict-Transport-Security trên máy chủ'
    ],
    optimize: [
      'Thêm header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload'
    ],
    examples: [
      'Tránh trường hợp người dùng gõ http://domain.com và bị đánh chặn trước khi máy chủ chuyển hướng sang https.'
    ]
  },
  {
    slug: 'security-csp',
    metric: 'Security: CSP',
    title: 'Chính sách bảo mật nội dung (CSP)',
    summary: 'CSP là lớp bảo mật bổ sung ngăn chặn các cuộc tấn công XSS (Cross-Site Scripting) và chèn dữ liệu độc hại.',
    causes: [
      'Cho phép thực thi mã JavaScript inline hoặc từ mọi nguồn bên ngoài'
    ],
    optimize: [
      'Thiết lập header Content-Security-Policy giới hạn nguồn script hợp lệ',
      'Tránh sử dụng "unsafe-inline" và "unsafe-eval"'
    ],
    examples: [
      'Chặn một đoạn mã độc do tin tặc chèn vào bình luận vì nó gọi một script từ tên miền lạ.'
    ]
  },
  {
    slug: 'security-xframe',
    metric: 'Security: X-Frame-Options',
    title: 'Bảo vệ chống Clickjacking',
    summary: 'Ngăn chặn trang web bị nhúng vào khung iframe của tên miền khác, bảo vệ người dùng khỏi việc bị lừa bấm vào các nút ẩn.',
    causes: [
      'Thiếu cấu hình header X-Frame-Options'
    ],
    optimize: [
      'Thêm header: X-Frame-Options: DENY hoặc SAMEORIGIN'
    ],
    examples: [
      'Kẻ xấu nhúng trang thanh toán của bạn vào một trang web giả mạo và phủ lên trên đó một nút "Nhận thưởng" trong suốt.'
    ]
  }
];

export function getKnowledge(slug: string): KnowledgeArticle | undefined {
  return knowledgeArticles.find(a => a.slug === slug);
}

export function knowledgeForMetric(name: string): { slug: string; title: string } | null {
  const normalized = name.toLowerCase();
  
  const found = knowledgeArticles.find(a => a.metric.toLowerCase() === normalized || a.slug.toLowerCase() === normalized);
  if (found) {
    return { slug: found.slug, title: found.title };
  }
  
  if (normalized.includes('lcp')) return { slug: 'lcp', title: getKnowledge('lcp')!.title };
  if (normalized.includes('inp')) return { slug: 'inp', title: getKnowledge('inp')!.title };
  if (normalized.includes('cls')) return { slug: 'cls', title: getKnowledge('cls')!.title };
  if (normalized.includes('ttfb')) return { slug: 'ttfb', title: getKnowledge('ttfb')!.title };
  if (normalized.includes('tbt')) return { slug: 'tbt', title: getKnowledge('tbt')!.title };
  
  return null;
}

export function knowledgeForIssue(issue: { id?: string; ruleId?: string }): { slug: string; title: string } | null {
  if (!issue.id && !issue.ruleId) return null;
  
  const idStr = (issue.id || '').toLowerCase();
  const ruleIdStr = (issue.ruleId || '').toLowerCase();
  const searchString = `${idStr} ${ruleIdStr}`;
  
  // Try finding direct matches in the articles
  for (const article of knowledgeArticles) {
    if (idStr === article.slug || ruleIdStr === article.slug) {
      return { slug: article.slug, title: article.title };
    }
  }
  
  // Performance
  if (searchString.includes('largest-contentful-paint') || searchString.includes('lcp')) {
    return { slug: 'lcp', title: getKnowledge('lcp')!.title };
  }
  if (searchString.includes('interaction-to-next-paint') || searchString.includes('inp')) {
    return { slug: 'inp', title: getKnowledge('inp')!.title };
  }
  if (searchString.includes('cumulative-layout-shift') || searchString.includes('cls')) {
    return { slug: 'cls', title: getKnowledge('cls')!.title };
  }
  
  // SEO
  if (searchString.includes('title') || searchString.includes('document-title')) {
    return { slug: 'seo-title', title: getKnowledge('seo-title')!.title };
  }
  if (searchString.includes('meta-description')) {
    return { slug: 'seo-meta', title: getKnowledge('seo-meta')!.title };
  }
  if (searchString.includes('structured-data') || searchString.includes('jsonld')) {
    return { slug: 'seo-jsonld', title: getKnowledge('seo-jsonld')!.title };
  }
  
  // Accessibility
  if (searchString.includes('image-alt') || searchString.includes('alt')) {
    return { slug: 'wcag-img-alt', title: getKnowledge('wcag-img-alt')!.title };
  }
  
  // Security
  if (searchString.includes('strict-transport-security') || searchString.includes('hsts')) {
    return { slug: 'security-hsts', title: getKnowledge('security-hsts')!.title };
  }
  if (searchString.includes('content-security-policy') || searchString.includes('csp')) {
    return { slug: 'security-csp', title: getKnowledge('security-csp')!.title };
  }
  if (searchString.includes('x-frame-options') || searchString.includes('xframe')) {
    return { slug: 'security-xframe', title: getKnowledge('security-xframe')!.title };
  }
  
  return null;
}