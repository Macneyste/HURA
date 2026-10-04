import { useState } from 'react';
import { Button, Card, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); setMessage(''); try { await updateProfile({ fullName, phone }); setMessage('Profile preferences saved.'); } catch { setMessage('We could not save your changes. Please check your details.'); } finally { setSaving(false); } };
  return <><div><p className="text-sm text-muted">Personal account</p><h1 className="text-2xl font-extrabold text-ink dark:text-white">Your profile</h1></div><div className="mt-6 grid max-w-4xl gap-5 md:grid-cols-[.8fr_1.5fr]"><Card className="p-6"><span className="grid h-16 w-16 place-items-center rounded-full bg-university-50 text-xl font-bold text-university-500">{user?.fullName.split(' ').map((x) => x[0]).slice(0,2).join('')}</span><h2 className="mt-4 font-bold text-ink dark:text-white">{user?.fullName}</h2><p className="text-sm text-muted">{user?.email}</p><div className="mt-5 border-t border-slate-200 pt-4 text-sm dark:border-slate-800"><p className="text-muted">Role</p><p className="mt-1 font-semibold">{user?.role.replace('_', ' ')}</p><p className="mt-4 text-muted">Account status</p><p className="mt-1 font-semibold text-green-600">Active</p></div></Card><Card className="p-6"><h2 className="font-bold text-ink dark:text-white">Account details</h2><p className="mt-1 text-sm text-muted">Keep your contact information current.</p><div className="mt-5 grid gap-4"><Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)}/><Input label="Email address" type="email" value={user?.email ?? ''} disabled/><Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)}/></div>{message && <p className={`mt-4 text-sm ${message.startsWith('Profile') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}<Button loading={saving} className="mt-5" onClick={save}>Save changes</Button></Card></div></>;
}
