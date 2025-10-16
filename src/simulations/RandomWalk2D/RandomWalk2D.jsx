import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Container, Typography, Slider, Grid, Button } from '@mui/material';
import * as d3 from 'd3';
import { simulationStyles } from '../../styles/simulationStyles';

const RandomWalk2D = () => {
  // State variables
  const [isSimulating, setIsSimulating] = useState(false);
  const [numberOfParticles, setNumberOfParticles] = useState(10);
  const [latticeSize, setLatticeSize] = useState(20);
  const [numberOfJumps, setNumberOfJumps] = useState(100);
  const [currentPositions, setCurrentPositions] = useState(() => []);
  const [diffusivityData, setDiffusivityData] = useState(() => []);
  const [acceptanceRate, setAcceptanceRate] = useState(0);
  const latticeRef = useRef(null);
  const diffusivityRef = useRef(null);

  // Constants
  const cycleMultiplication = 1000;
  const EMPTY = 0;
  const D0 = 0.25; // Diffusivity at infinite dilution

  // Calculate theta and diffusivity
  useEffect(() => {
    const theta = numberOfParticles / (latticeSize * latticeSize);
    const D = D0 * (1 - theta);
    setAcceptanceRate(1 - theta);

    // Generate diffusivity data points
    const data = [];
    for (let n = 0; n <= numberOfParticles; n += Math.max(1, Math.floor(numberOfParticles / 10))) {
      const t = n / (latticeSize * latticeSize);
      data.push({
        particles: n,
        theta: t,
        diffusivity: D0 * (1 - t)
      });
    }
    setDiffusivityData(data);
  }, [numberOfParticles, latticeSize]);

  // Lattice visualization effect
  useEffect(() => {
    if (!latticeRef.current || !currentPositions.length) return;

    const width = simulationStyles.chart.width;
    const height = simulationStyles.chart.height;
    const margin = simulationStyles.chart.margin;

    // Clear previous SVG content
    d3.select(latticeRef.current).selectAll("*").remove();

    const svg = d3.select(latticeRef.current)
      .attr("width", width)
      .attr("height", height);

    // Add styles
    svg.append("style").text(`
      .axis-label { 
        font-size: ${simulationStyles.text.axisLabel.size}; 
        fill: ${simulationStyles.text.axisLabel.color};
      }
      .legend-text { 
        font-size: ${simulationStyles.text.legend.size}; 
        fill: ${simulationStyles.text.legend.color};
      }
      .tick text { 
        font-size: ${simulationStyles.text.ticks.size}; 
        fill: ${simulationStyles.text.ticks.color};
      }
    `);

    const x = d3.scaleLinear()
      .domain([0, latticeSize])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, latticeSize])
      .range([height - margin.bottom, margin.top]);

    // Add grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .tickSize(-width + margin.left + margin.right)
        .tickFormat("")
      )
      .style("stroke-dasharray", simulationStyles.chart.grid.strokeDasharray)
      .style("stroke-opacity", simulationStyles.chart.grid.opacity);

    // Add particles
    svg.selectAll("circle")
      .data(currentPositions)
      .join("circle")
      .attr("cx", d => x(d.x))
      .attr("cy", d => y(d.y))
      .attr("r", 5)
      .attr("fill", simulationStyles.plot.primaryColor)
      .attr("opacity", simulationStyles.plot.opacity.medium);

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Add axis labels
    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left - simulationStyles.spacing.margin.large)
      .attr("x", -(height / 2))
      .attr("text-anchor", "middle")
      .text("Y Position");

    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height - simulationStyles.spacing.margin.small)
      .attr("text-anchor", "middle")
      .text("X Position");

  }, [currentPositions, latticeSize]);

  // Diffusivity plot effect
  useEffect(() => {
    if (!diffusivityRef.current || !diffusivityData.length) return;

    const width = simulationStyles.chart.width;
    const height = simulationStyles.chart.height;
    const margin = simulationStyles.chart.margin;

    // Clear previous SVG content
    d3.select(diffusivityRef.current).selectAll("*").remove();

    const svg = d3.select(diffusivityRef.current)
      .attr("width", width)
      .attr("height", height);

    // Add styles
    svg.append("style").text(`
      .axis-label { 
        font-size: ${simulationStyles.text.axisLabel.size}; 
        fill: ${simulationStyles.text.axisLabel.color};
      }
      .legend-text { 
        font-size: ${simulationStyles.text.legend.size}; 
        fill: ${simulationStyles.text.legend.color};
      }
      .tick text { 
        font-size: ${simulationStyles.text.ticks.size}; 
        fill: ${simulationStyles.text.ticks.color};
      }
    `);

    const x = d3.scaleLinear()
      .domain([0, 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, D0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Add grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .tickSize(-width + margin.left + margin.right)
        .tickFormat("")
      )
      .style("stroke-dasharray", simulationStyles.chart.grid.strokeDasharray)
      .style("stroke-opacity", simulationStyles.chart.grid.opacity);

    // Create the line generator
    const line = d3.line()
      .x(d => x(d.theta))
      .y(d => y(d.diffusivity));

    // Add the path
    svg.append("path")
      .datum(diffusivityData)
      .attr("fill", "none")
      .attr("stroke", simulationStyles.plot.primaryColor)
      .attr("stroke-width", simulationStyles.plot.lineThickness.medium)
      .attr("d", line);

    // Add current point
    const currentTheta = numberOfParticles / (latticeSize * latticeSize);
    const currentD = D0 * (1 - currentTheta);
    
    svg.append("circle")
      .attr("cx", x(currentTheta))
      .attr("cy", y(currentD))
      .attr("r", 6)
      .attr("fill", simulationStyles.plot.secondaryColor);

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Add axis labels
    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left - simulationStyles.spacing.margin.large)
      .attr("x", -(height / 2))
      .attr("text-anchor", "middle")
      .text("Diffusivity (D/D₀)");

    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height - simulationStyles.spacing.margin.small)
      .attr("text-anchor", "middle")
      .text("Occupancy (θ)");

  }, [diffusivityData, numberOfParticles, latticeSize]);

  // Helper function for random number generation
  const getRandomNumber = () => {
    return Math.random();
  };

  // Function to generate suitable ticks
  const generateTicks = (min, max, targetCount, initial) => {
    const range = max - min;
    const step = range/targetCount;

    const ticks = [];
    let start = min < 0 ? min - step : min;
    const end = max;
    
    ticks.push(start + initial);
    for (let tick = start + step; tick <= end - step; tick += step) {
      ticks.push(tick);
    }
    ticks.push(end);

    return ticks;
  };

  const performRandomWalk = useCallback(() => {
    setIsSimulating(true);
    
    // Initialize lattice and particle positions
    const lattice = Array(latticeSize).fill().map(() => Array(latticeSize).fill(EMPTY));
    const particlePosX = Array(numberOfParticles).fill(0);
    const particlePosY = Array(numberOfParticles).fill(0);
    
    // Place particles randomly on the lattice
    for (let j = 0; j < numberOfParticles; j++) {
      let x, y;
      do {
        x = Math.floor(getRandomNumber() * latticeSize);
        y = Math.floor(getRandomNumber() * latticeSize);
      } while (lattice[x][y] !== EMPTY);

      lattice[x][y] = j + 1;
      particlePosX[j] = x;
      particlePosY[j] = y;
    }

    // Current positions for visualization
    const positions = particlePosX.map((x, i) => ({
      x: x,
      y: particlePosY[i],
      id: i + 1
    }));

    setCurrentPositions(positions);
    setIsSimulating(false);
  }, [numberOfParticles, latticeSize]);

  const startSimulation = () => {
    performRandomWalk();
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: simulationStyles.spacing.section.marginTop }}>
        <Typography 
          sx={{ 
            fontSize: simulationStyles.text.title.size,
            color: simulationStyles.text.title.color,
            mb: 2 
          }}
        >
          2D Random Walk Simulation
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography 
              sx={{ 
                fontSize: simulationStyles.text.subtitle.size,
                color: simulationStyles.text.subtitle.color,
                mb: 1 
              }}
            >
              Number of Particles
            </Typography>
            <Slider
              value={numberOfParticles}
              onChange={(_, value) => setNumberOfParticles(value)}
              min={1}
              max={latticeSize * latticeSize - 1}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography 
              sx={{ 
                fontSize: simulationStyles.text.subtitle.size,
                color: simulationStyles.text.subtitle.color,
                mb: 1 
              }}
            >
              Lattice Size
            </Typography>
            <Slider
              value={latticeSize}
              onChange={(_, value) => setLatticeSize(value)}
              min={5}
              max={50}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography 
              sx={{ 
                fontSize: simulationStyles.text.subtitle.size,
                color: simulationStyles.text.subtitle.color,
                mb: 1 
              }}
            >
              Number of Jumps
            </Typography>
            <Slider
              value={numberOfJumps}
              onChange={(_, value) => setNumberOfJumps(value)}
              min={10}
              max={1000}
              step={10}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              onClick={startSimulation}
              disabled={isSimulating}
              sx={{ mt: 4 }}
            >
              Start Simulation
            </Button>
          </Grid>
        </Grid>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography 
              sx={{ 
                fontSize: simulationStyles.text.subtitle.size,
                color: simulationStyles.text.subtitle.color,
                mb: 2 
              }}
            >
              Lattice Configuration
            </Typography>
            <svg ref={latticeRef} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography 
              sx={{ 
                fontSize: simulationStyles.text.subtitle.size,
                color: simulationStyles.text.subtitle.color,
                mb: 2 
              }}
            >
              Diffusivity vs Occupancy
            </Typography>
            <svg ref={diffusivityRef} />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default RandomWalk2D;