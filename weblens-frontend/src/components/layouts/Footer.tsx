import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-zinc-200/50 bg-zinc-50/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-5xl px-6 sm:px-16 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 inline-block">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-900">
                <span className="text-xs font-bold text-white">W</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-900">WebLens</span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              Phân tích trang web bằng AI với góc nhìn mới mẻ. Nhận báo cáo toàn diện về Hiệu suất, SEO, Khả năng truy cập và Bảo mật.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Sản phẩm</h3>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <Link href="/" className="transition-colors hover:text-zinc-900">Báo cáo phân tích</Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-zinc-900">Bảng điều khiển</Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-900">Bảng giá</Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-900">Lịch sử cập nhật</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Tài nguyên</h3>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-900">Tài liệu</Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-900">Blog</Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-900">Hướng dẫn</Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-900">Hỗ trợ</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Pháp lý</h3>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-900">Quyền riêng tư</Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-900">Điều khoản</Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-zinc-900">Bảo mật</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200/50 pt-8 sm:flex-row">
          <p className="text-sm text-zinc-400">
            &copy; {new Date().getFullYear()} WebLens Inc. Đã đăng ký bản quyền.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </Link>
            <Link href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <span className="sr-only">GitHub</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
