import React, { useState } from "react";
import { Lock, Eye, EyeOff, RefreshCw, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import GlassCard from "../../components/GlassCard";

const ChangePassword: React.FC = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSuccess("Password changed successfully!");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => navigate("/student/settings"), 1200);
  };

  const inputConfigs = [
    {
      label: "Old Password",
      value: oldPassword,
      setValue: setOldPassword,
      show: showOld,
      setShow: setShowOld,
      placeholder: "Enter your old password",
      autoComplete: "current-password",
    },
    {
      label: "New Password",
      value: newPassword,
      setValue: setNewPassword,
      show: showNew,
      setShow: setShowNew,
      placeholder: "Enter a new password",
      autoComplete: "new-password",
    },
    {
      label: "Confirm New Password",
      value: confirmPassword,
      setValue: setConfirmPassword,
      show: showConfirm,
      setShow: setShowConfirm,
      placeholder: "Re-enter new password",
      autoComplete: "new-password",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl w-full mx-auto p-4 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Change Password</h1>
          <p className="text-gray-400">Secure your account by changing your password.</p>
        </div>

        <GlassCard className="p-6 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {inputConfigs.map((field, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-300 mb-2">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.show ? "text" : "password"}
                    value={field.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:outline-none pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => field.setShow((v: boolean) => !v)}
                    tabIndex={-1}
                  >
                    {field.show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}

            {error && (
              <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 text-sm text-center">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:brightness-110 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Change Password
                </>
              )}
            </button>
          </form>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default ChangePassword;
