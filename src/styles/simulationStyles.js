// Global style configuration for all simulations
export const simulationStyles = {
  text: {
    title: {
      size: '40px',
      color: '#A7C9FF',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    subtitle: {
      size: '24px',
      color: '#A7C9FF',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    body: {
      size: '16px',
      color: '#A7C9FF',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    axisLabel: {
      size: '20px',
      color: '#A7C9FF',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    legend: {
      size: '16px',
      color: '#95a5a6',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    ticks: {
      size: '16px',
      color: '#bdc3c7',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }
  },
  plot: {
    primaryColor: '#87ADDD',
    secondaryColor: '#4A90E2',
    tertiaryColor: '#4ECDC4',
    gridColor: '#CCCCCC',
    lineThickness: {
      thin: 1,
      medium: 2,
      thick: 3
    },
    opacity: {
      light: 0.3,
      medium: 0.6,
      full: 1
    }
  },
  background: {
    primary: '#1a1a1a',
    secondary: '#2a2a2a'
  },
  chart: {
    margin: { top: 20, right: 30, left: 80, bottom: 60 },
    width: 600,
    height: 400,
    grid: {
      strokeDasharray: '2,2',
      opacity: 0.2
    }
  },
  spacing: {
    section: {
      marginBottom: 4,
      marginTop: 4
    },
    control: {
      marginBottom: 2,
      marginTop: 2,
      marginLeft: 2,
      marginRight: 2,
      paddingBottom: 2,
      paddingTop: 2,
      paddingLeft: 2,
      paddingRight: 2
    },
    padding: {
      small: 8,
      medium: 16,
      large: 24
    },
    margin: {
      small: 8,
      medium: 16,
      large: 32,
      Extralarge: 48
    }
  },
  table: {
    container: {
      maxHeight: '800px',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: '#2a2a2a'
    },
    header: {
      backgroundColor: '#1a1a1a',
      color: '#A7C9FF'
    },
    cell: {
      padding: '8px',
      borderBottom: '1px solid #3a3a3a'
    }
  },
  controlBox: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a'
  },
  plotBox: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    marginTop: 16,
    marginBottom: 16
  }
}
