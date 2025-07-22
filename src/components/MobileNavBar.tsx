@@ .. @@
 import React from 'react';
-import { Home, BarChart3, Search, MoreHorizontal } from 'lucide-react';
+import { Home, BarChart3, Wrench, User } from 'lucide-react';

 interface MobileNavBarProps {
-  activeView: 'globe' | 'stats' | 'search' | 'more';
-  onViewChange: (view: 'globe' | 'stats' | 'search' | 'more') => void;
+  activeView: 'globe' | 'stats' | 'tools' | 'account';
+  onViewChange: (view: 'globe' | 'stats' | 'tools' | 'account') => void;
 }

 export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeView, onViewChange }) => {
   return (
     <div className="mobile-nav-bar">
       <button 
         className={`nav-item ${activeView === 'globe' ? 'active' : ''}`}
         onClick={() => onViewChange('globe')}
       >
         <Home size={20} />
         <span>Globe</span>
       </button>
       
       <button 
         className={`nav-item ${activeView === 'stats' ? 'active' : ''}`}
         onClick={() => onViewChange('stats')}
       >
         <BarChart3 size={20} />
         <span>Stats</span>
       </button>
       
       <button 
-        className={`nav-item ${activeView === 'search' ? 'active' : ''}`}
-        onClick={() => onViewChange('search')}
+        className={`nav-item ${activeView === 'tools' ? 'active' : ''}`}
+        onClick={() => onViewChange('tools')}
       >
-        <Search size={20} />
-        <span>Search</span>
+        <Wrench size={20} />
+        <span>Tools</span>
       </button>
       
       <button 
-        className={`nav-item ${activeView === 'more' ? 'active' : ''}`}
-        onClick={() => onViewChange('more')}
+        className={`nav-item ${activeView === 'account' ? 'active' : ''}`}
+        onClick={() => onViewChange('account')}
       >
-        <MoreHorizontal size={20} />
-        <span>More</span>
+        <User size={20} />
+        <span>Account</span>
       </button>
     </div>
   );
 };