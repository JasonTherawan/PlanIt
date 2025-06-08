import { useState } from "react"
import Sidebar from "../components/mainPage/Sidebar"
import CalendarGrid from "../components/mainPage/CalendarGrid"
import Header from "../components/mainPage/Header"
import ProfileSidebar from "../components/mainPage/ProfileSidebar"

export default function MainPage(){
    const [currentDate, setCurrentDate] = useState(new Date())
    const [dataUpdateTrigger, setDataUpdateTrigger] = useState(0)
    const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false)
    const [events, setEvents] = useState([])

    const addEvent = (newEvent) => {
        setEvents([...events, { id: Date.now(), ...newEvent }])
    }

    const handleDataUpdate = () => {
        setDataUpdateTrigger((prev) => prev + 1)
    }

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Fixed sidebar */}
            <div className="w-56 flex-shrink-0">
                <Sidebar
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    events={events}
                    addEvent={addEvent}
                    onDataUpdate={handleDataUpdate}
                />
            </div>

            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Fixed header */}
                <div className="flex-shrink-0">
                    <Header
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        onProfileClick={() => setIsProfileSidebarOpen(true)}
                    />
                </div>

                {/* Calendar grid */}
                <CalendarGrid
                    currentDate={currentDate}
                    events={events}
                    setCurrentDate={setCurrentDate}
                    dataUpdateTrigger={dataUpdateTrigger}
                />
                
                {/* Profile Sidebar */}
                <ProfileSidebar isOpen={isProfileSidebarOpen} onClose={() => setIsProfileSidebarOpen(false)} />
            </div>
        </div>
    )
}