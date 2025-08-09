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

    // Prepare data for chart
    const labels = data.monthly_stats.map(stat => stat.month_name);
    const totalData = data.monthly_stats.map(stat => stat.total_items);
    
    // Create stacked data for each type
    const textData = data.monthly_stats.map(stat => stat.by_type.TEXT);
    const linkData = data.monthly_stats.map(stat => stat.by_type.LINK);
    const audioData = data.monthly_stats.map(stat => stat.by_type.AUDIO);
    const videoData = data.monthly_stats.map(stat => stat.by_type.VIDEO);

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Items',
            data: totalData,
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(16, 185, 129, 1)',
            pointBorderColor: 'white',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          },
          {
            label: 'TEXT',
            data: textData,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: 'white',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'LINK',
            data: linkData,
            borderColor: 'rgba(34, 197, 94, 1)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointBackgroundColor: 'rgba(34, 197, 94, 1)',
            pointBorderColor: 'white',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'AUDIO',
            data: audioData,
            borderColor: 'rgba(245, 158, 11, 1)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointBackgroundColor: 'rgba(245, 158, 11, 1)',
            pointBorderColor: 'white',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'VIDEO',
            data: videoData,
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointBackgroundColor: 'rgba(239, 68, 68, 1)',
            pointBorderColor: 'white',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              font: {
                size: 12
              },
              color: '#374151'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function(context) {
                return context[0].label;
              },
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y} items`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            border: {
              display: false
            },
            ticks: {
              color: '#6B7280',
              font: {
                size: 12
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(209, 213, 219, 0.5)',
              drawBorder: false
            },
            border: {
              display: false
            },
            ticks: {
              color: '#6B7280',
              font: {
                size: 12
              },
              callback: function(value) {
                return Number.isInteger(value) ? value : '';
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1200,
          easing: 'easeInOutQuart'
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