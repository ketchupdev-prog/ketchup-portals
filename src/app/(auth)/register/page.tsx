import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="card bg-base-100 shadow-xl w-full max-w-md">
      <div className="card-body">
        <h1 className="card-title text-2xl">Create account</h1>
        <p className="text-content-muted text-sm">Register for the Ketchup Portals.</p>
        <div className="form-control mt-4">
          <label className="label" htmlFor="email">
            <span className="label-text">Email</span>
          </label>
          <input id="email" type="email" placeholder="you@example.com" className="input input-bordered w-full" />
          <label className="label" htmlFor="password">
            <span className="label-text">Password</span>
          </label>
          <input id="password" type="password" className="input input-bordered w-full" />
        </div>
        <div className="card-actions justify-between mt-6">
          <Link href="/login" className="link link-primary text-sm">Sign in</Link>
          <button type="button" className="btn btn-primary">Create account</button>
        </div>
      </div>
    </div>
  );
}
