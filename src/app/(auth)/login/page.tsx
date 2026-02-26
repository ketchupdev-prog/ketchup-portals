import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="card bg-base-100 shadow-xl w-full max-w-md">
      <div className="card-body">
        <h1 className="card-title text-2xl">Sign in</h1>
        <div className="form-control mt-4">
          <input type="email" placeholder="Email" className="input input-bordered w-full" />
          <input type="password" placeholder="Password" className="input input-bordered w-full mt-2" />
        </div>
        <div className="card-actions justify-between mt-6">
          <Link href="/register" className="link link-primary text-sm">Create account</Link>
          <button type="button" className="btn btn-primary">Sign in</button>
        </div>
      </div>
    </div>
  );
}
