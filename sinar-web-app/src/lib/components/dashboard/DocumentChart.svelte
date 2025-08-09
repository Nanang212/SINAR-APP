<script lang="ts">
  import { onMount } from 'svelte';
  import type { DocumentStatistics } from '$lib/services/dashboard/dashboard.service';

  interface Props {
    data: DocumentStatistics;
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
    
    // Destroy any existing chart on this canvas
    Chart.getChart(ctx)?.destroy();

    // Prepare data for chart
    const labels = data.monthly_stats.map(stat => stat.month_name);
    const documentData = data.monthly_stats.map(stat => stat.total_documents);
    
    console.log('DocumentChart data:', { 
      labels, 
      documentData, 
      totalYear: data.total_documents_year,
      augustusData: documentData[7] // Agustus = index 7
    });

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Documents',
            data: documentData,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: function(context) {
                return context[0]?.label || '';
              },
              label: function(context) {
                console.log('DocumentChart tooltip:', context.parsed.y);
                return `${context.parsed.y} documents`;
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
              color: 'rgba(209, 213, 219, 0.5)'
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
          duration: 1000,
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