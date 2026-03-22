'use client';

/**
 * Admin Settings – System configuration, feature flags, and admin preferences
 */

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-base-content">Admin Settings</h1>
        <p className="text-sm text-content-muted mt-1">System configuration, feature flags & admin preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Feature Flags</h2>
            <div className="space-y-3">
              {[
                { name: 'AI Copilot', enabled: true, description: 'Enable AI assistant across portals' },
                { name: 'Real-time Analytics', enabled: true, description: 'Live dashboard updates' },
                { name: 'Advanced Fraud Detection', enabled: true, description: 'ML-powered fraud detection' },
                { name: 'Beta Features', enabled: false, description: 'Enable experimental features' },
              ].map((flag) => (
                <div key={flag.name} className="flex items-start justify-between p-3 bg-base-100 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{flag.name}</h3>
                    <p className="text-xs text-content-muted">{flag.description}</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" checked={flag.enabled} readOnly />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">System Configuration</h2>
            <div className="space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Session Timeout (minutes)</span>
                </label>
                <input type="number" className="input input-bordered" defaultValue={30} />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">API Rate Limit (requests/min)</span>
                </label>
                <input type="number" className="input input-bordered" defaultValue={100} />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Log Retention (days)</span>
                </label>
                <input type="number" className="input input-bordered" defaultValue={90} />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Alert Email Recipients</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  defaultValue="admin@smartpay.na, ops@smartpay.na"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Notification Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Critical Alerts', email: true, sms: true, push: true },
              { name: 'Security Events', email: true, sms: false, push: true },
              { name: 'System Updates', email: true, sms: false, push: false },
              { name: 'Daily Reports', email: true, sms: false, push: false },
            ].map((pref) => (
              <div key={pref.name} className="p-3 bg-base-100 rounded-lg">
                <h3 className="font-medium mb-2">{pref.name}</h3>
                <div className="flex gap-4">
                  <label className="label cursor-pointer gap-2">
                    <input type="checkbox" className="checkbox checkbox-sm" checked={pref.email} readOnly />
                    <span className="label-text text-xs">Email</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input type="checkbox" className="checkbox checkbox-sm" checked={pref.sms} readOnly />
                    <span className="label-text text-xs">SMS</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input type="checkbox" className="checkbox checkbox-sm" checked={pref.push} readOnly />
                    <span className="label-text text-xs">Push</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn btn-ghost">Reset to Defaults</button>
        <button className="btn btn-primary">Save Changes</button>
      </div>
    </div>
  );
}
