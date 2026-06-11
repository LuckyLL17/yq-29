import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { DraftAngleResult, WallThicknessResult, MoldingCycleResult } from '@/types';

interface DraftAngleChartProps {
  result: DraftAngleResult;
}

const COLORS = ['#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4'];

export function DraftAngleChart({ result }: DraftAngleChartProps) {
  const data = result.angleDistribution.map((item) => ({
    name: item.range,
    count: item.count,
    percentage: item.percentage.toFixed(1) + '%',
  }));

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ThicknessChartProps {
  result: WallThicknessResult;
}

export function ThicknessChart({ result }: ThicknessChartProps) {
  const data = result.thicknessDistribution.map((item) => ({
    name: item.range,
    count: item.count,
  }));

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
          />
          <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CyclePieChartProps {
  result: MoldingCycleResult;
}

export function CyclePieChart({ result }: CyclePieChartProps) {
  const data = [
    { name: '吸浆', value: result.suctionTime, color: '#06b6d4' },
    { name: '压制', value: result.pressingTime, color: '#8b5cf6' },
    { name: '干燥', value: result.dryingTime, color: '#f97316' },
    { name: '脱模', value: result.demoldingTime, color: '#22c55e' },
  ];

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}s`]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
