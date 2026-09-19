export default function ProfilePage() {
  return (
    <div className="space-y-8 relative z-10">
      <div className="border-b border-slate-800/60 pb-6">
        <h1 className="text-4xl font-bold tracking-tight text-white">Profile</h1>
        <p className="text-slate-400 text-lg mt-2">Your public profile.</p>
      </div>
      
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 shadow-xl backdrop-blur-sm flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-500/20 mb-6">
          A
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Anonymous Developer</h2>
        <p className="text-slate-500">Coming soon! You will be able to customize your profile and bio here.</p>
      </div>
    </div>
  );
}
