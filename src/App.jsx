import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemText, ListItemButton, Collapse, Typography } from '@mui/material';
import ParticleDistribution from './simulations/ParticleDistribution/ParticleDistribution';
import IdealGas from './simulations/IdealGas/IdealGas';
import BoltzmannDistribution from './simulations/BoltzmannDistribution/BoltzmannDistribution';
import RandomWalk1D from './simulations/RandomWalk1D/RandomWalk1D';
import RandomWalk2D from './simulations/RandomWalk2D/RandomWalk2D';
import CalculationOfPi from './simulations/CalculationOfPi/CalculationOfPi';
import FlipCoin from './simulations/FlipCoin/FlipCoin';
import LandingPage from './components/LandingPage';
import './App.css';

const drawerWidth = 240;

const menuItems = [
  {
    title: 'Home',
    path: '/',
    submenu: []
  },
  {
    title: 'Theory',
    path: '/theory',
    submenu: []
  },
  {
    title: 'Simulations',
    path: '/simulations',
    submenu: [
      { title: 'Particle Distribution', path: '/particle-distribution' },
      { title: 'Ideal Gas', path: '/ideal-gas' },
      { title: 'Boltzmann Distribution', path: '/boltzmann' },
      { title: 'Random Walk 1D', path: '/random-walk-1d' },
      { title: 'Random Walk 2D', path: '/random-walk-2d' },
      { title: 'Coupled Harmonic Oscillator', path: '/oscillator' },
      { title: 'Calculation of π', path: '/calculation-of-pi' },
      { title: 'Flip Coin', path: '/flip-coin' }
    ]
  },
  {
    title: 'Videos',
    path: '/videos',
    submenu: []
  }
];

function App() {
  const [openSubmenu, setOpenSubmenu] = React.useState('');

  const handleSubmenuClick = (title) => {
    setOpenSubmenu(openSubmenu === title ? '' : title);
  };

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: '#0a0a1a',
              color: '#ffffff',
              borderRight: '1px solid rgba(135, 173, 221, 0.2)',
            },
          }}
        >
          <Box sx={{ overflow: 'auto', mt: 2 }}>
            <List>
              {menuItems.map((item) => (
                <React.Fragment key={item.title}>
                  <ListItemButton
                    component={item.submenu.length === 0 ? 'a' : 'div'}
                    href={item.submenu.length === 0 ? item.path : undefined}
                    onClick={() => item.submenu.length > 0 ? handleSubmenuClick(item.title) : null}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'rgba(135, 173, 221, 0.2)',
                      },
                    }}
                  >
                    <ListItemText 
                      primary={item.title} 
                      sx={{
                        '& .MuiTypography-root': {
                          fontSize: '1.2rem',
                          fontWeight: item.title === 'Home' ? 'bold' : 'normal',
                        }
                      }}
                    />
                  </ListItemButton>
                  {item.submenu.length > 0 && (
                    <Collapse in={openSubmenu === item.title} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.submenu.map((subItem) => (
                          <ListItemButton
                            key={subItem.title}
                            component="a"
                            href={subItem.path}
                            sx={{
                              pl: 4,
                              py: 1.2,
                              '&:hover': {
                                backgroundColor: 'rgba(135, 173, 221, 0.2)',
                              },
                            }}
                          >
                            <ListItemText 
                              primary={subItem.title}
                              sx={{
                                '& .MuiTypography-root': {
                                  fontSize: '1.1rem',
                                  color: '#e6f0ff',
                                }
                              }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              ))}
            </List>
          </Box>
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: '#0a0a1a',
            minHeight: '100vh',
          }}
        >
          <Routes>
            <Route exact path="/" element={<LandingPage />} />
            <Route path="/particle-distribution" element={<ParticleDistribution />} />
            <Route path="/ideal-gas" element={<IdealGas />} />
            <Route path="/boltzmann" element={<BoltzmannDistribution />} />
            <Route path="/random-walk-1d" element={<RandomWalk1D />} />
            <Route path="/random-walk-2d" element={<RandomWalk2D />} />
            <Route path="/calculation-of-pi" element={<CalculationOfPi />} />
            <Route path="/flip-coin" element={<FlipCoin />} />
            <Route path="/oscillator" element={<div>Coupled Harmonic Oscillator (Coming Soon)</div>} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
