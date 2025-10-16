import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Slider, Grid } from '@mui/material';
import * as d3 from 'd3';
import { simulationStyles } from '../../styles/simulationStyles';

const ENERGY_LEVELS = 21; // 0 to 20

const BoltzmannDistribution = () => {
  const [temperature, setTemperature] = useState(1.0);
  const [distribution, setDistribution] = useState([]);
  const [yAxisMax, setYAxisMax] = useState(1.0);
  const svgRef = useRef(null);

  // Calculate all three distributions
  const calculateDistributions = (temp) => {
    const beta = 1.0 / temp;
    let normalDist = [];
    let degenerateDist = [];
    let rotorDist = [];
    let normalNorm = 0.0;
    let degenerateNorm = 0.0;
    let rotorNorm = 0.0;

    // Calculate unnormalized probabilities and normalization factors
    for (let i = 0; i < ENERGY_LEVELS; i++) {
      // Normal Boltzmann distribution
      const normalProb = Math.exp(-beta * i);
      normalDist.push(normalProb);
      normalNorm += normalProb;

      // Distribution with degeneracy = i+1
      const degenerateProb = (i + 1) * Math.exp(-beta * i);
      degenerateDist.push(degenerateProb);
      degenerateNorm += degenerateProb;

      // Rotational energy distribution
      const rotorProb = (2 * i + 1) * Math.exp(-beta * i * (i + 1));
      rotorDist.push(rotorProb);
      rotorNorm += rotorProb;
    }

    // Normalize all distributions
    const distributionData = Array.from({ length: ENERGY_LEVELS }, (_, i) => ({
      energy: i,
      normal: normalDist[i] / normalNorm,
      degenerate: degenerateDist[i] / degenerateNorm,
      rotor: rotorDist[i] / rotorNorm
    }));

    setDistribution(distributionData);
    setYAxisMax(Math.max(
      ...distributionData.map(d => Math.max(d.normal, d.degenerate, d.rotor))
    ));
  };

  useEffect(() => {
    calculateDistributions(temperature);
  }, [temperature]);

  useEffect(() => {
    if (!svgRef.current || !distribution.length) return;

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
      .domain([0, ENERGY_LEVELS - 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, yAxisMax])
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

    // Create line generators
    const createLine = (key) => {
      return d3.line()
        .x(d => x(d.energy))
        .y(d => y(d[key]));
    };

    // Add lines for each distribution
    const distributions = [
      { key: 'normal', name: 'Normal', color: simulationStyles.plot.primaryColor },
      { key: 'degenerate', name: 'Degenerate', color: simulationStyles.plot.secondaryColor },
      { key: 'rotor', name: 'Rotor', color: simulationStyles.plot.tertiaryColor }
    ];

    distributions.forEach(dist => {
      svg.append("path")
        .datum(distribution)
        .attr("fill", "none")
        .attr("stroke", dist.color)
        .attr("stroke-width", simulationStyles.plot.lineThickness.medium)
        .attr("d", createLine(dist.key));

      // Add points
      svg.selectAll(`.points-${dist.key}`)
        .data(distribution)
        .join("circle")
        .attr("class", `points-${dist.key}`)
        .attr("cx", d => x(d.energy))
        .attr("cy", d => y(d[dist.key]))
        .attr("r", 4)
        .attr("fill", dist.color);
    });

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
      .text("Probability");

    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height - simulationStyles.spacing.margin.small)
      .attr("text-anchor", "middle")
      .text("Energy Level");

    // Add legend
    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("class", "legend-text")
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(distributions)
      .join("g")
      .attr("transform", (d, i) => `translate(${margin.left},${margin.top + i * simulationStyles.spacing.margin.medium})`);

    legend.append("rect")
      .attr("x", 0)
      .attr("width", simulationStyles.spacing.margin.medium)
      .attr("height", simulationStyles.spacing.margin.medium)
      .attr("fill", d => d.color)
      .attr("opacity", simulationStyles.plot.opacity.full);

    legend.append("text")
      .attr("x", simulationStyles.spacing.margin.large)
      .attr("y", simulationStyles.spacing.margin.medium / 2)
      .attr("dy", "0.32em")
      .text(d => d.name);

  }, [distribution, yAxisMax]);

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
          Boltzmann Distribution
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography 
              sx={{ 
                fontSize: simulationStyles.text.subtitle.size,
                color: simulationStyles.text.subtitle.color,
                mb: 1 
              }}
            >
              Temperature (kT)
            </Typography>
            <Slider
              value={temperature}
              onChange={(_, value) => setTemperature(value)}
              min={0.1}
              max={5.0}
              step={0.1}
              marks={[
                { value: 0.1, label: '0.1' },
                { value: 5.0, label: '5.0' }
              ]}
              valueLabelDisplay="auto"
              sx={{
                '& .MuiSlider-markLabel': {
                  color: simulationStyles.text.ticks.color
                }
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <svg ref={svgRef} />
        </Box>
      </Box>
    </Container>
  );
};

export default BoltzmannDistribution;