import Footer from "@/components/customer/layout/Footer";
import Navbar from "@/components/customer/layout/Navbar";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-yellow-500 selection:text-black">
      <Navbar />
      <main className="pt-5"> 
        {children}
      </main>
      <Footer />
    </div>
  )
}
