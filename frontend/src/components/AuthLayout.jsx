import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';
import QuizPatternBG from './QuizPatternBG';

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex">
      {/* Branded side panel - hidden on small screens to keep mobile focused on the form */}
      <div className="hidden lg:flex lg:w-2/5 bg-ink relative overflow-hidden flex-col justify-between p-10 text-white">
        <QuizPatternBG className="absolute inset-0 text-white" />
        <div className="relative z-10">
          <Link to="/">
            <BrandMark dark />
          </Link>
        </div>
        <div className="relative z-10 max-w-sm">
          <p className="font-display text-3xl leading-snug">
            Every question is a chance to move up the leaderboard.
          </p>
        </div>
        <div className="relative z-10 text-sm text-white/50">
          For students, teachers, and school admins.
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link to="/">
              <BrandMark />
            </Link>
          </div>

          <h1 className="font-display text-3xl font-semibold text-ink mb-1">{title}</h1>
          <p className="text-ink-soft mb-8">{subtitle}</p>

          {children}

          {footer && <div className="mt-6 text-sm text-ink-soft text-center">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
