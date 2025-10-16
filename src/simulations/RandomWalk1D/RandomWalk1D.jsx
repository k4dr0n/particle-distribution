import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Container, Typography, Slider, Grid, Button } from '@mui/material';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ScatterChart, Scatter } from 'recharts';
import * as d3 from 'd3';
import { simulationStyles } from '../../styles/simulationStyles';

// Secure random number generator using crypto
const getRandomNumber = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
};

const RandomWalk1D = () => {
  const [jumpProbability, setJumpProbability] = useState(0.5);
  const [numberOfJumps, setNumberOfJumps] = useState(1000);
  const [numberOfCycles, setNumberOfCycles] = useState(100);
  const [distribution, setDistribution] = useState([]);
  const [rmsDisplacement, setRmsDisplacement] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentWalk, setCurrentWalk] = useState([]);
  const maxLattice = 1000;
  const svgRef = useRef(null);

  // Function to generate suitable ticks
  const generateTicks = (min, max, targetCount, initial) => {
    const range = max - min;
    const step = range/targetCount; // Math.pow(10, Math.floor(Math.log10(range)));

    const ticks = [];
    let start; 
    if (min < 0)  start = min - step;
    else  start = min; // Math.floor(min / finalStep) * finalStep;
    const end = max; // Math.floor(max / finalStep) * finalStep;
    ticks.push(start+initial);
    for (let tick = start+step; tick <= end-step; tick += step) {
      ticks.push(tick);
    }
    ticks.push(end);

    return ticks;
  };

  const performRandomWalk = useCallback(() => {
    setIsSimulating(true);
    const distributionArray = new Array(2 * maxLattice + 1).fill(0);
    const rmsArray = new Array(numberOfJumps).fill(0);
    const rmsCount = new Array(numberOfJumps).fill(0);
    let normalization = 0;

    // Perform multiple cycles
    for (let cycle = 0; cycle < numberOfCycles; cycle++) {
      let currentPosition = 0;
      const walkPositions = [{x: 0, y: currentPosition}];

      // Perform random walk
      for (let step = 0; step < numberOfJumps; step++) {
        if (getRandomNumber() < jumpProbability) {
          currentPosition++;
        } else {
          currentPosition--;
        }

        // Record position for visualization
        walkPositions.push({x: step + 1, y: currentPosition});

        // Calculate RMS displacement
        for (let t0 = 0; t0 <= step; t0++) {
          const dt = step - t0;
          const displacement = currentPosition - walkPositions[t0].y;
          rmsArray[dt] += displacement * displacement;
          rmsCount[dt]++;
        }
      }

      // Update distribution
      if (Math.abs(currentPosition) <= maxLattice) {
        distributionArray[currentPosition + maxLattice]++;
      }
      normalization++;

      // Show the last walk trajectory
      if (cycle === numberOfCycles - 1) {
        setCurrentWalk(walkPositions);
      }
    }

    // Normalize distribution and calculate theoretical curve
    const distributionData = [];
    for (let i = -numberOfJumps; i <= numberOfJumps; i++) {
      const measured = (i >= -maxLattice && i <= maxLattice) 
        ? distributionArray[i + maxLattice] / normalization 
        : 0;
      const theoretical = Math.exp(
        0.5 * Math.log(2 / (numberOfJumps * Math.PI)) - 
        (i * i) / (2 * numberOfJumps)
      );
      distributionData.push({
        position: i,
        measured,
        theoretical
      });
    }

    // Calculate RMS displacement
    const rmsData = rmsArray.map((sum, dt) => ({
      time: dt+1,
      rms: Math.sqrt(sum / (rmsCount[dt] || 1))
    }));

    setDistribution(distributionData);
    setRmsDisplacement(rmsData);
    setIsSimulating(false);
  }, [jumpProbability, numberOfJumps, numberOfCycles]);

  useEffect(() => {
    if (!svgRef.current || !currentWalk.length) return;

    const width = simulationStyles.chart.width;
    const height = simulationStyles.chart.height;
    const margin = simulationStyles.chart.margin;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
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
      .domain([0, currentWalk.length - 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain(d3.extent(currentWalk.map(d => d.y)))
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
      .x((d, i) => x(i))
      .y(d => y(d.y));

    // Add the path
    svg.append("path")
      .datum(currentWalk)
      .attr("fill", "none")
      .attr("stroke", simulationStyles.plot.primaryColor)
      .attr("stroke-width", simulationStyles.plot.lineThickness.medium)
      .attr("d", line);

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
      .text("Position");

    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height - simulationStyles.spacing.margin.small)
      .attr("text-anchor", "middle")
      .text("Step");

  }, [currentWalk]);

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
            mb: simulationStyles.spacing.section.marginBottom 
          }}
        >
          1D Random Walk
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: simulationStyles.spacing.margin.medium }}>
              <Typography 
                sx={{ 
                  fontSize: simulationStyles.text.subtitle.size,
                  color: simulationStyles.text.subtitle.color,
                  mb: 1 
                }}
              >
                Jump Right Probability: {jumpProbability.toFixed(2)}
              </Typography>
              <Slider
                value={jumpProbability}
                onChange={(e, newValue) => setJumpProbability(newValue)}
                min={0}
                max={1}
                step={0.1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 0.5, label: '0.5' },
                  { value: 1, label: '1' }
                ]}
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
                Number of Steps: {numberOfJumps}
              </Typography>
              <Slider
                value={numberOfJumps}
                onChange={(e, newValue) => setNumberOfJumps(newValue)}
                min={100}
                max={1000}
                step={100}
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
                Number of Cycles: {numberOfCycles}
              </Typography>
              <Slider
                value={numberOfCycles}
                onChange={(e, newValue) => setNumberOfCycles(newValue)}
                min={500}
                max={5000}
                step={500}
                sx={{ width: '100%' }}
              />
            </Box>

            <Button 
              variant="contained" 
              onClick={performRandomWalk}
              disabled={isSimulating}
              sx={{ mt: 2 }}
            >
              {isSimulating ? 'Simulating...' : 'Start Simulation'}
            </Button>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography 
              sx={{ 
                fontSize: simulationStyles.text.subtitle.size,
                color: simulationStyles.text.subtitle.color,
                mb: simulationStyles.spacing.margin.medium 
              }}
            >
              Last Walk Trajectory
            </Typography>
            <svg ref={svgRef} />
            <Typography 
              sx={{ 
                fontSize: simulationStyles.text.subtitle.size,
                color: simulationStyles.text.subtitle.color,
                mb: simulationStyles.spacing.margin.medium,
                mt: simulationStyles.spacing.section.marginTop 
              }}
            >
              Position Distribution
            </Typography>
            <LineChart
              width={simulationStyles.chart.width}
              height={simulationStyles.chart.height}
              data={distribution}
              margin={simulationStyles.chart.margin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={simulationStyles.plot.gridColor} />
              <XAxis 
                dataKey="position"
                domain={[-numberOfJumps, numberOfJumps]}
                ticks={generateTicks(-numberOfJumps, numberOfJumps, 10, 0)}
                label={{ 
                  value: 'Position', 
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
                  value: 'Probability', 
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
              <Line
                type="monotone"
                dataKey="measured"
                stroke={simulationStyles.plot.primaryColor}
                dot={false}
                name="Measured"
              />
              {/* <Line
                type="monotone"
                dataKey="Theoretical"
                stroke={simulationStyles.plot.secondaryColor}
                dot={false}
                // lineThickness={simulationStyles.plot.lineThickness.thick}
                name="Theoretical"
              /> */}
            </LineChart>

            <Typography 
              sx={{ 
                fontSize: simulationStyles.text.subtitle.size,
                color: simulationStyles.text.subtitle.color,
                mb: simulationStyles.spacing.margin.medium,
                mt: simulationStyles.spacing.section.marginTop 
              }}
            >
              RMS Displacement
            </Typography>
            <LineChart
              width={simulationStyles.chart.width}
              height={simulationStyles.chart.height}
              data={rmsDisplacement}
              margin={simulationStyles.chart.margin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={simulationStyles.plot.gridColor} />
              <XAxis 
                dataKey="time"
                domain={[0, numberOfJumps]}
                ticks={generateTicks(0, numberOfJumps, 10, 1)}
                label={{ 
                  value: 'Time', 
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
                  value: 'RMS Displacement', 
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
              <Line 
                type="monotone" 
                dataKey="rms" 
                stroke={simulationStyles.plot.primaryColor} 
                strokeWidth={simulationStyles.plot.lineThickness.thick}
                dot={false}
                name="RMS"
              />
            </LineChart>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default RandomWalk1D;