import { SearchView } from './components/SearchView';
import { ToolsView } from './components/ToolsView';
import { AccountView } from './components/AccountView';
import { SettingsPanel } from './components/SettingsPanel';
import { AudioPlayer } from './components/AudioPlayer';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeView, setActiveView] = useState<'globe' | 'stats' | 'tools' | 'account'>('globe');
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<any>(null);
  const [isMusicMuted, setIsMusicMuted] = useState(true);
  const [volume, setVolume] = useState(50);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  
  const { theme, setTheme } = useTheme();

  const renderMainContent = () => {
    switch (activeView) {
      case 'globe':
        return (
          <Globe
            ref={globeRef}
            theme={theme}
            memoryData={memoryData}
            onCountryClick={handleCountryClick}
          />
        );
      case 'stats':
        return <StatsView memoryData={memoryData} />;
      case 'tools':
        return (
          <ToolsView 
            memoryData={memoryData} 
            onCountrySearch={handleCountrySearch}
          />
        );
      case 'account':
        return (
          <AccountView
            onResetData={handleResetData}
            memoryData={memoryData}
            onUpdateCountryData={updateCountryData}
            globeRef={globeRef}
          />
        );
      default:
        return null;
    }
  };

   return (
     <div className={`app ${theme}`} data-theme={theme}>
       <AudioPlayer muted={isMusicMuted} volume={volume} />
       
       {showSplash && <SplashScreen onClose={handleSplashClick} />}
       
       {!showSplash && (
         <>
          <TopBar 
            memoryData={memoryData} 
            showSettings={activeView === 'globe'}
            onSettingsClick={() => setShowSettingsPanel(true)}
          />
          
          <div className="main-content">
            {renderMainContent()}
          </div>
          
          <MobileNavBar 
            activeView={activeView} 
            onViewChange={setActiveView} 
          />
          
          {showMemoryPanel && currentCountry && (
            <MemoryPanel
              country={currentCountry}
              onClose={handleCloseMemoryPanel}
              onUpdateData={updateCountryData}
              getCountryData={getCountryData}
              theme={theme}
              globeRef={globeRef}
            />
          )}
          
          {showSettingsPanel && (
            <SettingsPanel
              theme={theme}
              onThemeChange={handleThemeChange}
              onToggleMusic={handleToggleMusic}
              isMusicMuted={isMusicMuted}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              onClose={() => setShowSettingsPanel(false)}
            />
          )}
        </>
      )}
    </div>
  );
}