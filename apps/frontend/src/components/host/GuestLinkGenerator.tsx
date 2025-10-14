import React, { useState } from "react";
import GlassCard from "../GlassCard";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";

const generateUniqueGuestId = (): string => {
    return "guest-" + Math.random().toString(36).substring(2, 10);
};

interface GuestLinkGeneratorProps {
    meetingId: string;
}


const GuestLinkGenerator: React.FC<GuestLinkGeneratorProps> = ({ meetingId }) => {
    const [guestLink, setGuestLink] = useState<string | null>(null);

    const generateGuestLink = () => {
        const uniqueGuestId = generateUniqueGuestId();
        const relativePath = `/guest?meetingId=${encodeURIComponent(meetingId)}&displayName=${encodeURIComponent(uniqueGuestId)}`;
        const fullLink = `${window.location.origin}${relativePath}`;
        setGuestLink(fullLink);
        toast.success("Guest link generated!");
    };

    const copyToClipboard = () => {
        if (guestLink) {
            navigator.clipboard.writeText(guestLink).then(() => {
                toast.success("Copied to clipboard!");
            });
        }
    };


    return (
        <GlassCard className="p-6">
            <div className="flex flex-col items-center gap-5">
                <h3 className="text-xl font-bold text-white text-center">Generate Guest Access Link</h3>

                <button
                    onClick={generateGuestLink}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl shadow-md hover:opacity-90 transition duration-200 text-sm sm:text-base"
                >
                    GENERATE GUEST LINK
                </button>

                {guestLink && (
                    <div className="w-full bg-white/10 border border-white/20 rounded-lg p-4 shadow-inner flex flex-col items-center gap-2">
                        {/* Centered label and copy button */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-100">Guest Link:</span>
                            <button
                                onClick={copyToClipboard}
                                className="p-1.5 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition"
                                title="Copy link"
                            >
                                <Copy className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        {/* Centered link below */}
                        <p className="text-center text-[15px] font-medium text-blue-300 break-words max-w-full">
                            <a
                                href={guestLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline hover:text-blue-400 transition"
                            >
                                {guestLink}
                            </a>
                        </p>
                    </div>
                )}
            </div>
        </GlassCard>
    );
};

export default GuestLinkGenerator;
