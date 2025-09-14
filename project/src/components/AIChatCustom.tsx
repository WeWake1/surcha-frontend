import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Mic } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import Orb from "./ui/Orb";
import { speechToText } from "../utils/speechToText";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface AIChatProps {
  dashboardType?: "nurse" | "chemist" | "inventory" | "admin" | "ambulance" | "doctor";
}

export function AIChatCustom({ dashboardType = "doctor" }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [demoLoaded, setDemoLoaded] = useState(false);

  // Dashboard-specific demo conversations
  const demoConversations = {
    nurse: [
      { text: "Hi! I'm your nursing assistant AI. How can I help you today?", sender: "ai" as const },
      { text: "What medications are due for room 302?", sender: "user" as const },
      { text: "Patient Sarah Johnson in room 302 has the following medications due: Metformin 500mg at 2:00 PM, Lisinopril 10mg at 6:00 PM, and Insulin Humalog 8 units before dinner. Would you like me to set reminders or update administration records?", sender: "ai" as const },
      { text: "Set reminder for the insulin", sender: "user" as const },
      { text: "✓ Reminder set for insulin administration (8 units Humalog) for Sarah Johnson, room 302, before dinner. I'll notify you 30 minutes before mealtime. Is there anything else I can help with regarding patient care?", sender: "ai" as const }
    ],
    chemist: [
      { text: "Hello! I'm your pharmacy AI assistant. How can I assist with medication management today?", sender: "ai" as const },
      { text: "Check drug interactions for new prescription", sender: "user" as const },
      { text: "I'd be happy to check drug interactions. Could you please provide the medication name and dosage, along with the patient's current medications? I can also review their medical history for contraindications.", sender: "ai" as const },
      { text: "Patient is on Warfarin 5mg, new prescription is Amoxicillin 500mg", sender: "user" as const },
      { text: "⚠️ MODERATE INTERACTION DETECTED: Amoxicillin may increase the anticoagulant effect of Warfarin, potentially increasing bleeding risk. Recommendations: 1) Monitor INR levels more frequently 2) Consider dose adjustment 3) Patient counseling on bleeding signs. Alternative: Cephalexin may be safer. Shall I generate a detailed interaction report?", sender: "ai" as const }
    ],
    inventory: [
      { text: "Hi! I'm your inventory management AI. Ready to help optimize your supply chain!", sender: "ai" as const },
      { text: "Show critical stock levels", sender: "user" as const },
      { text: "📊 CRITICAL STOCK ALERT:\n• Surgical gloves: 12% remaining (Order urgently)\n• N95 masks: 8% remaining (Emergency reorder)\n• Syringes 10ml: 15% remaining (Order this week)\n• IV bags 0.9% saline: 22% remaining (Monitor closely)\n\nShall I initiate automatic reorders or would you like to review supplier options first?", sender: "ai" as const },
      { text: "Initiate reorder for gloves and masks", sender: "user" as const },
      { text: "✅ REORDERS INITIATED:\n• Surgical gloves: 10,000 units from MedSupply Co. (ETA: 2 days)\n• N95 masks: 5,000 units from SafetyFirst Ltd. (ETA: 1 day)\n\nTotal cost: $3,847. Orders sent to procurement. Tracking numbers will be provided once shipped. Would you like me to set up alerts for delivery status?", sender: "ai" as const }
    ],
    admin: [
      { text: "Welcome! I'm your administrative AI assistant for hospital operations and compliance.", sender: "ai" as const },
      { text: "Generate staff efficiency report", sender: "user" as const },
      { text: "📈 STAFF EFFICIENCY REPORT (Last 30 Days):\n\n🏥 Overall Performance: 87% efficiency\n👩‍⚕️ Nursing: 89% (Above target)\n👨‍⚕️ Physicians: 92% (Excellent)\n🏥 Support Staff: 81% (Below target)\n\n⚠️ Areas needing attention:\n• Patient discharge processing: 23% delay\n• Equipment maintenance: 18% overdue\n\nShall I generate detailed recommendations and improvement strategies?", sender: "ai" as const },
      { text: "Yes, show improvement strategies", sender: "user" as const },
      { text: "🎯 IMPROVEMENT STRATEGIES:\n\n1️⃣ Discharge Processing:\n• Implement digital discharge checklist\n• Train staff on new EHR workflows\n• Est. 35% improvement in 2 weeks\n\n2️⃣ Equipment Maintenance:\n• Automated scheduling system\n• Preventive maintenance protocols\n• Est. 40% reduction in overdue items\n\n💰 ROI: $125K savings annually\nImplementation timeline: 4-6 weeks\n\nShall I create implementation tasks?", sender: "ai" as const }
    ],
    ambulance: [
      { text: "Emergency AI Assistant online. Ready to support critical patient care and transport decisions.", sender: "ai" as const },
      { text: "Patient vitals trending down, what's the protocol?", sender: "user" as const },
      { text: "🚨 CRITICAL PROTOCOL ACTIVATED:\n\nVitals decline detected. Immediate actions:\n1️⃣ Establish large-bore IV access\n2️⃣ Administer high-flow O2\n3️⃣ Monitor cardiac rhythm\n4️⃣ Prepare for advanced airway\n\n🏥 Nearest trauma center: St. Mary's (ETA 6 min)\n📞 Alert sent to receiving hospital\n\nCurrent recommendations based on presentation?", sender: "ai" as const },
      { text: "Chest pain, possible MI", sender: "user" as const },
      { text: "🫀 ACUTE MI PROTOCOL:\n\n💊 Medications:\n• Aspirin 324mg (if not contraindicated)\n• Nitroglycerin 0.4mg SL\n• Morphine 2-4mg IV for pain\n\n📊 12-lead EKG: Transmit to hospital\n🏥 STEMI alert activated at St. Mary's\n⏱️ Door-to-balloon time: <90 min target\n\nCath lab standing by. Continue monitoring and prepare for immediate transfer to cath lab upon arrival.", sender: "ai" as const }
    ],
    doctor: [
      { text: "Hello Dr. Smith! I'm your medical AI assistant. How can I support your clinical decisions today?", sender: "ai" as const },
      { text: "Review patient Maria Garcia's latest results", sender: "user" as const },
      { text: "📋 PATIENT REVIEW - Maria Garcia:\n\n🩸 Latest Labs (Today):\n• Glucose: 95 mg/dL (Normal ✓)\n• Creatinine: 0.8 mg/dL (Normal ✓)\n• Potassium: 3.4 mEq/L (Low ⚠️)\n\n📈 Trends: BP improved, sleep quality better\n💊 Current meds: Continuing current regimen\n\n⚠️ Action needed: Consider K+ supplementation\nNext appointment: Follow-up in 2 weeks", sender: "ai" as const }
    ]
  };

  // Initialize with demo conversation on component mount
  useEffect(() => {
    if (!demoLoaded) {
      const demoMessages = demoConversations[dashboardType].map((msg, index) => ({
        id: index + 1,
        text: msg.text,
        sender: msg.sender,
        timestamp: new Date(Date.now() - (demoConversations[dashboardType].length - index) * 30000) // 30 seconds apart
      }));
      setMessages(demoMessages);
      setDemoLoaded(true);
    }
  }, [dashboardType, demoLoaded]);

  // Initialize speech recognition on component mount
  useEffect(() => {
    speechToText.setLanguage('en-US');
    
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");

    // Simulate AI response with context-aware demo responses
    setTimeout(() => {
      let aiResponse = "I understand your request. Let me help you with that.";
      
      // Context-aware responses based on dashboard type
      const contextResponses = {
        nurse: "I'll check the patient records and medication schedules for you.",
        chemist: "Let me review the prescription details and check for any drug interactions.",
        inventory: "I'll analyze the current stock levels and supply chain status.",
        admin: "I'll generate the requested report and compliance metrics.",
        ambulance: "Analyzing patient condition and emergency protocols. Stand by.",
        doctor: "Reviewing patient data and clinical guidelines for your case."
      };

      aiResponse = contextResponses[dashboardType] || aiResponse;

      const aiMessage: Message = {
        id: messages.length + 2,
        text: aiResponse,
        sender: "ai",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleMicClick = () => {
    if (!speechToText.isSupported()) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      speechToText.stopListening();
      setIsListening(false);
      setIsRecording(false);
    } else {
      setIsListening(true);
      setIsRecording(true);
      setCurrentTranscript("");
      
      speechToText.startListening(
        (transcript: string) => {
          setCurrentTranscript(transcript);
          setInputValue(transcript);
        },
        (error: string) => {
          console.error('Speech recognition error:', error);
          setIsListening(false);
          setIsRecording(false);
        }
      );
    }
  };

  const getDashboardTitle = () => {
    const titles = {
      nurse: "Nursing Assistant AI",
      chemist: "Pharmacy AI",
      inventory: "Inventory Management AI", 
      admin: "Administrative AI",
      ambulance: "Emergency Response AI",
      doctor: "Medical AI Assistant"
    };
    return titles[dashboardType];
  };

  const getDashboardColor = () => {
    const colors = {
      nurse: "bg-blue-600",
      chemist: "bg-green-600",
      inventory: "bg-purple-600",
      admin: "bg-orange-600", 
      ambulance: "bg-red-600",
      doctor: "bg-neutral-900"
    };
    return colors[dashboardType];
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className={`rounded-full h-12 w-12 ${getDashboardColor()} hover:scale-110 transition-transform shadow-lg`}
        >
          <MessageCircle className="h-5 w-5 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] z-50 rounded-2xl shadow-xl overflow-hidden"
         style={{
           background: 'rgba(15, 23, 42, 0.95)',
           backdropFilter: 'blur(20px)',
           WebkitBackdropFilter: 'blur(20px)',
           border: '1px solid rgba(100, 116, 139, 0.3)'
         }}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Orb />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse opacity-20"></div>
          </div>
          <div>
            <h3 className="font-medium text-white text-sm">{getDashboardTitle()}</h3>
            <p className="text-xs text-slate-400">Online • Demo Mode</p>
          </div>
        </div>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 h-[380px] p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  message.sender === "user"
                    ? `${getDashboardColor()} text-white`
                    : "bg-slate-700 text-white"
                }`}
              >
                <p className="whitespace-pre-line">{message.text}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-700 p-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                
                if (typingTimeout) {
                  clearTimeout(typingTimeout);
                }
                
                if (e.target.value.length > 0) {
                  setIsTyping(true);
                  const deactivateTimeout = setTimeout(() => {
                    setIsTyping(false);
                  }, 1000);
                  
                  setTypingTimeout(deactivateTimeout);
                }
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="w-full text-white placeholder-slate-400 rounded-xl border-none focus:ring-0 focus:outline-none pr-10 text-sm md:text-base"
              style={{ 
                background: 'rgba(15, 23, 42, 0.4)', 
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#ffffff',
                border: '1px solid rgba(100, 116, 139, 0.4)'
              }}
              placeholder={`Ask ${getDashboardTitle().toLowerCase()}...`}
              readOnly={isListening}
            />
            <Button
              onClick={handleMicClick}
              size="icon"
              className={`absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 md:h-8 md:w-8 rounded-lg transition-all duration-300 ${
                isListening || isRecording
                  ? 'bg-red-500/40 hover:bg-red-500/50 text-red-200 shadow-lg' 
                  : 'bg-white/10 hover:bg-white/20 text-gray-200'
              }`}
            >
              <Mic className={`h-3 w-3 md:h-4 md:w-4 transition-transform duration-200 ${isListening ? 'scale-110' : ''}`} />
            </Button>
          </div>
          
          <Button
            onClick={handleSendMessage}
            size="icon"
            className={`rounded-xl h-8 w-8 md:h-10 md:w-10 text-white transition-colors flex-shrink-0 ${getDashboardColor()}`}
          >
            <Send className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}