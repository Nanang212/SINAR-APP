<script lang="ts">
  import { onMount } from 'svelte';
  import type { ReportStatistics } from '$lib/services/dashboard/dashboard.service';

  interface Props {
    data: ReportStatistics;
  }

  let { data }: Props = $props();
  let chartCanvas: HTMLCanvasElement;
  let chartInstance: any;

  onMount(async () => {
    // Dynamic import Chart.js untuk mengurangi bundle size
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    const ctx = chartCanvas.getContext('2d');
    if (!ctx) return;

    // Calculate totals for each type across all months
    const typeTotals = data.types.map(type => 
      data.monthly_stats.reduce((sum, month) => sum + month.by_type[type], 0)
    );

    // Filter out types with zero values for cleaner pie chart
    const filteredData = data.types
      .map((type, index) => ({ type, total: typeTotals[index] }))
      .filter(item => item.total > 0);

    const labels = filteredData.map(item => item.type);
    const values = filteredData.map(item => item.total);
    
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue for TEXT
      'rgba(34, 197, 94, 0.8)',    // Green for LINK  
      'rgba(245, 158, 11, 0.8)',   // Yellow for AUDIO
      'rgba(239, 68, 68, 0.8)'     // Red for VIDEO
    ];

    const borderColors = [
      'rgba(59, 130, 246, 1)',
      'rgba(34, 197, 94, 1)',
      'rgba(245, 158, 11, 1)',
      'rgba(239, 68, 68, 1)'
    ];

    // Define center text plugin
    const totalItems = values.reduce((sum, value) => sum + value, 0);
    const centerTextPlugin = {
      id: 'centerText',
      beforeDraw: function(chart) {
        const { width, height, ctx } = chart;
        ctx.restore();
        
        const fontSize = Math.min(width, height) / 15;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1F2937';
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.fillText(totalItems.toString(), centerX, centerY - 10);
        
        ctx.font = `${fontSize * 0.6}px Inter, sans-serif`;
        ctx.fillStyle = '#6B7280';
        ctx.fillText('Total Items', centerX, centerY + 15);
        
        ctx.save();
      }
    };

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors.slice(0, values.length),
            borderColor: borderColors.slice(0, values.length),
            borderWidth: 2,
            hoverBorderWidth: 3,
            hoverOffset: 8
          }
        ]
      },
      plugins: totalItems > 0 ? [centerTextPlugin] : [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              font: {
                size: 14,
                weight: '500'
              },
              color: '#374151',
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  const dataset = data.datasets[0];
                  return data.labels.map((label, i) => ({
                    text: `${label} (${dataset.data[i]})`,
                    fillStyle: dataset.backgroundColor[i],
                    strokeStyle: dataset.borderColor[i],
                    lineWidth: dataset.borderWidth,
                    hidden: false,
                    index: i
                  }));
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(209, 213, 219, 1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                const percentage = ((context.parsed * 100) / total).toFixed(1);
                return `${context.label}: ${context.parsed} items (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        interaction: {
          intersect: false
        }
      }
    });

  });

  // Cleanup chart on component destroy
  onMount(() => {
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  });
</script>

<div class="w-full h-full relative">
  <canvas bind:this={chartCanvas} class="w-full h-full"></canvas>
</div>