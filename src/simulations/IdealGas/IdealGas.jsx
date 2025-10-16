import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, Slider, Button, Grid } from '@mui/material';
import { ComposedChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, ReferenceLine } from 'recharts';
import { simulationStyles } from '../../styles/simulationStyles';

const IdealGasSimulation = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [histogramData, setHistogramData] = useState([]);
  const [temperature, setTemperature] = useState(300); // Kelvin
  const [particleCount, setParticleCount] = useState(100); // Initial number of particles
  const [pressure, setPressure] = useState(0);
  const [kineticEnergy, setKineticEnergy] = useState(0);
  const [rmsVelocity, setRmsVelocity] = useState(0);
  const [measuredTemp, setMeasuredTemp] = useState(0);
  const [pressureHistory, setPressureHistory] = useState([]);
  const MAX_HISTORY_LENGTH = 50; // Store last 100 measurements

  // Simulation parameters for Argon gas
  const MASS = 6.633e-26;  // kg (mass of Argon atom)
  const RADIUS = 1.88e-10;  // m (van der Waals radius of Argon)
  const L = 1e-8;  // m (box size, 10 nanometers)
  const DT = 5e-14;  // s (100 nanoseconds)
  const k_B = 1.380649e-23;  // Boltzmann constant
  
  // Scale factors for visualization
  const BOX_WIDTH = 500;
  const BOX_HEIGHT = 500;
  const DISPLAY_RADIUS = 4;  // pixels

    // Calculate fixed velocity range based on max temperature
  const MAX_TEMP = 1000; // K (matches slider max)
  const mostProbableSpeedAtMaxTemp = Math.sqrt(2 * k_B * MAX_TEMP / MASS);
  const MAX_VEL = 3 * mostProbableSpeedAtMaxTemp;
  const BIN_COUNT = 40;
  const BIN_WIDTH = MAX_VEL / BIN_COUNT;
  

  class Particle {
    constructor(x, y, vx, vy) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.radius = RADIUS;
      this.mass = MASS;
    }
    
    update() {
      this.x += this.vx * DT;
      this.y += this.vy * DT;
    }
    
    // handleWallCollisions() {
    //   if (this.x - this.radius < 0 || this.x + this.radius > L) {
    //     this.vx *= -1;
    //   }
    //   if (this.y - this.radius < 0 || this.y + this.radius > L) {
    //     this.vy *= -1;
    //   }
    // }
    handleWallCollisions() {
      // Periodic boundary conditions for x direction
      if (this.x < 0) {
          this.x += L;  // Appear on right side
      } else if (this.x > L) {
          this.x -= L;  // Appear on left side
      }
      
      // Periodic boundary conditions for y direction
      if (this.y < 0) {
          this.y += L;  // Appear on top
      } else if (this.y > L) {
          this.y -= L;  // Appear on bottom
      }
  }


  }

  const initializeParticles = (temp, count) => {
    const particles = [];
    const gridSize = Math.floor(Math.sqrt(count));
    const spacing = L / (gridSize + 1);
    
    let particleCount = 0;
    for (let i = 0; i < gridSize && particleCount < count; i++) {
      for (let j = 0; j < gridSize && particleCount < count; j++) {
        const x = (i + 1) * spacing;
        const y = (j + 1) * spacing;
        
        // Maxwell-Boltzmann velocity distribution using Box-Muller transform
        const std = Math.sqrt(k_B * temp / MASS);
        const vx = std * Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
        const vy = std * Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
        
        particles.push(new Particle(x, y, vx, vy));
        particleCount++;
      }
    }
    return particles;
  };

  const handleParticleCollisions = (particles) => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[j].x - particles[i].x;
        const dy = particles[j].y - particles[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 2 * RADIUS) {
          const normalX = dx / distance;
          const normalY = dy / distance;
          
          const relativeVelocityX = particles[i].vx - particles[j].vx;
          const relativeVelocityY = particles[i].vy - particles[j].vy;
          
          const impulse = 2 * MASS * (relativeVelocityX * normalX + relativeVelocityY * normalY) 
                         / (2 * MASS);
          
          particles[i].vx -= impulse * normalX;
          particles[i].vy -= impulse * normalY;
          particles[j].vx += impulse * normalX;
          particles[j].vy += impulse * normalY;
        }
      }
    }
  };
  // Add calculation function
  const updateThermodynamics = (particles) => {
    // Calculate RMS velocity
    const velocitiesSquared = particles.map(p => p.vx * p.vx + p.vy * p.vy);
    const avgVSquared = velocitiesSquared.reduce((a, b) => a + b) / particles.length;
    const rms = Math.sqrt(avgVSquared);
    
    // Calculate kinetic energy
    const totalKE = 0.5 * MASS * velocitiesSquared.reduce((a, b) => a + b);
    const avgKE = totalKE / particles.length;
    
    // Calculate temperature from kinetic energy (in 2D: KE = k_B * T)
    const calculatedTemp = avgKE / k_B;
    
    // Calculate pressure (from momentum transfer to walls)
    // Note: In 2D, pressure is force per unit length
    let momentumTransfer = 0;
    particles.forEach(p => {
      if (p.x - p.radius < 0 || p.x + p.radius > L || 
          p.y - p.radius < 0 || p.y + p.radius > L) {
        momentumTransfer += 2 * MASS * Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      }
    });
    const calculatedPressure = momentumTransfer / (4 * L * DT); // 4L is perimeter in 2D
    // Update pressure history
    setPressureHistory(prev => {
        const newHistory = [...prev, {
          time: prev.length === 0 ? 1 : prev[prev.length - 1].time + 1,  // Increment from last time
          pressure: calculatedPressure  //* 1e12 // Convert to pN/m
        }];
        // If we exceed MAX_HISTORY_LENGTH, shift the times when we slice
        if (newHistory.length > MAX_HISTORY_LENGTH) {
          return newHistory.slice(-MAX_HISTORY_LENGTH).map((point, index) => ({
              ...point,
              time: index + 1
          }));
      }
      return newHistory;
  });

    // Update state
    setRmsVelocity(rms);
    setKineticEnergy(totalKE);
    setMeasuredTemp(calculatedTemp);
    setPressure(calculatedPressure);
  };


  const updateHistogram = (particles, temp) => {
    const velocities = particles.map(p => 
      Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    );
    
    // Use fixed bins
    const bins = Array(BIN_COUNT).fill(0);
    velocities.forEach(v => {
      const binIndex = Math.min(Math.floor(v / BIN_WIDTH), BIN_COUNT - 1);
      bins[binIndex]++;
    });

    // Generate theoretical curve points
    const generateTheoretical = (v) => {
      return (MASS * v / (k_B * temp)) * Math.exp(-MASS * v * v / (2 * k_B * temp));
    };

    // Find maximum bin count for normalization
    const maxBinCount = Math.max(...bins);
    const normalizedBins = bins.map(count => count / maxBinCount);

    // Calculate theoretical values and normalize
    const theoreticalValues = Array(BIN_COUNT).fill(0).map((_, i) => {
      const velocity = (i + 0) * BIN_WIDTH;
      return generateTheoretical(velocity);
    });
    const maxTheoretical = Math.max(...theoreticalValues);
    // Create combined data with normalized values
    const histData = Array(BIN_COUNT).fill(0).map((_, i) => {
      const velocity = (i + 0) * BIN_WIDTH;
      return {
        velocity: velocity.toFixed(1),
        count: normalizedBins[i],
        theoretical: generateTheoretical(velocity) / maxTheoretical
    };
   });
   setHistogramData(histData);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = initializeParticles(temperature, particleCount);
    let animationFrameId;
    
    const simulate = () => {
      ctx.clearRect(0, 0, BOX_WIDTH, BOX_HEIGHT);
      
      // Draw box
      ctx.strokeStyle = simulationStyles.plot.gridColor;
      ctx.strokeRect(0, 0, BOX_WIDTH, BOX_HEIGHT);
      
      // Update particles
      handleParticleCollisions(particles);
      particles.forEach(particle => {
        particle.handleWallCollisions();
        particle.update();
        
        // Draw particle (scaled)
        ctx.beginPath();
        ctx.arc(
          (particle.x / L) * BOX_WIDTH, 
          (particle.y / L) * BOX_HEIGHT, 
          DISPLAY_RADIUS, 
          0, 
          2 * Math.PI
        );
        ctx.fillStyle = simulationStyles.plot.primaryColor;
        ctx.fill();
      });
      
      if (Math.random() < 0.1) {
        updateHistogram(particles, temperature);
        updateThermodynamics(particles);
      }
      
      if (isRunning) {
        animationFrameId = window.requestAnimationFrame(simulate);
      }
    };
    
    if (isRunning) {
      simulate();
    } else {
      // Draw initial state
      ctx.clearRect(0, 0, BOX_WIDTH, BOX_HEIGHT);
      ctx.strokeStyle = simulationStyles.plot.gridColor;
      ctx.strokeRect(0, 0, BOX_WIDTH, BOX_HEIGHT);
      particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(
          (particle.x / L) * BOX_WIDTH, 
          (particle.y / L) * BOX_HEIGHT, 
          DISPLAY_RADIUS, 
          0, 
          2 * Math.PI
        );
        ctx.fillStyle = simulationStyles.plot.primaryColor;
        ctx.fill();
      });
    }
    
    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [temperature, isRunning, particleCount]);

  useEffect(() => {
    console.log(histogramData);
  }, [histogramData]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: simulationStyles.spacing.section.marginTop }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: simulationStyles.text.title.size,
            color: simulationStyles.text.title.color,
            mb: simulationStyles.spacing.section.marginTop 
          }}
        >
          Ideal Gas Simulation
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={() => setIsRunning(!isRunning)}
              sx={{ mb: 2 }}
            >
              {isRunning ? 'Stop' : 'Start'} Simulation
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: simulationStyles.spacing.margin.medium }}>
              <Typography 
                sx={{ 
                  fontSize: simulationStyles.text.subtitle.size,
                  color: simulationStyles.text.subtitle.color,
                  mb: 1 
                }}
              >
                Temperature: {temperature} K
              </Typography>
              <Slider
                value={temperature}
                onChange={(e, newValue) => setTemperature(newValue)}
                min={100}
                max={1000}
                step={10}
                sx={{ width: '100%' }}
              />
            </Box>

            <Box sx={{ mb: simulationStyles.spacing.margin.medium }}>
              <Typography 
                sx={{ 
                  fontSize: simulationStyles.text.subtitle.size,
                  color: simulationStyles.text.subtitle.color,
                  mb: 1 
                }}
              >
                Number of Particles: {particleCount}
              </Typography>
              <Slider
                value={particleCount}
                onChange={(e, newValue) => {
                  if (isRunning) {
                    setIsRunning(false);
                  }
                  setParticleCount(newValue);
                }}
                min={100}
                max={1000}
                step={100}
                marks
                sx={{ width: '100%', mb: 3 }}
              />
            </Box>

            <Box sx={{ mb: simulationStyles.spacing.margin.medium }}>
              <Typography 
                sx={{ 
                  fontSize: simulationStyles.text.subtitle.size,
                  color: simulationStyles.text.subtitle.color 
                }}
              >
                Measured Values:
              </Typography>
              <Typography sx={{ fontSize: simulationStyles.text.subtitle.size }}>
                Pressure: {pressure.toFixed(2)} Pa
              </Typography>
              <Typography sx={{ fontSize: simulationStyles.text.subtitle.size }}>
                RMS Velocity: {rmsVelocity.toFixed(2)} m/s
              </Typography>
              <Typography sx={{ fontSize: simulationStyles.text.subtitle.size }}>
                Measured Temperature: {measuredTemp.toFixed(2)} K
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                width: '100%',
                height: BOX_HEIGHT,
                border: `1px solid ${simulationStyles.plot.gridColor}`,
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <canvas
                ref={canvasRef}
                width={BOX_WIDTH}
                height={BOX_HEIGHT}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography 
              sx={{ 
                fontSize: simulationStyles.text.subtitle.size,
                color: simulationStyles.text.subtitle.color,
                mb: 2 
              }}
            >
              Velocity Distribution
            </Typography>
            <ComposedChart
              width={800}
              height={400}
              data={histogramData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={simulationStyles.plot.gridColor} />
              <XAxis 
                dataKey="velocity" 
                label={{ 
                  value: 'Velocity (m/s)', 
                  position: 'bottom',
                  style: {
                    fontSize: simulationStyles.text.axisLabel.size,
                    fill: simulationStyles.text.axisLabel.color
                  }
                }}
                tick={{ fontSize: simulationStyles.text.ticks.size, fill: simulationStyles.text.ticks.color }}
              />
              <YAxis 
                label={{ 
                  value: 'Frequency', 
                  angle: -90, 
                  position: 'left',
                  style: {
                    fontSize: simulationStyles.text.axisLabel.size,
                    fill: simulationStyles.text.axisLabel.color
                  }
                }}
                tick={{ fontSize: simulationStyles.text.ticks.size, fill: simulationStyles.text.ticks.color }}
              />
              <Tooltip />
              <Legend 
                wrapperStyle={{ 
                  fontSize: simulationStyles.text.legend.size, 
                  color: simulationStyles.text.legend.color 
                }}
                verticalAlign="top"
                align="right"
              />
              <Bar 
                dataKey="count" 
                fill={simulationStyles.plot.primaryColor} 
                name="Measured"
              />
              <Line 
                type="monotone" 
                dataKey="theoretical" 
                stroke={simulationStyles.plot.secondaryColor} 
                dot={false} 
                name="Maxwell-Boltzmann"
              />
            </ComposedChart>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default IdealGasSimulation;