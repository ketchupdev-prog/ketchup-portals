'use client';

import { Card, CardContent } from './card';
import { StatusBadge } from './status-badge';
import { cn } from '@/lib/utils';

export interface DriverCardProps {
  name: string;
  phone?: string;
  region?: string;
  status?: 'active' | 'inactive';
  rating?: number;
  trips?: number;
}

export function DriverCard(props: DriverCardProps) {
  const { name, phone, region, status = 'active', rating, trips } = props;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-12">
              <span className="text-lg">{name.slice(0, 2).toUpperCase()}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold truncate">{name}</h4>
              <StatusBadge variant={status === 'active' ? 'success' : 'inactive'} size="sm">
                {status}
              </StatusBadge>
            </div>
            {phone && <p className="text-sm text-content-muted">{phone}</p>}
            {region && <p className="text-xs text-content-muted">{region}</p>}
            {(rating != null || trips != null) && (
              <p className="text-xs mt-1">
                {rating != null && `Rating: ${rating}`}
                {trips != null && ` · ${trips} trips`}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface VehicleCardProps {
  make: string;
  model: string;
  year?: number;
  licensePlate?: string;
  status?: 'active' | 'inactive';
  fuelLevel?: number;
  mileage?: number;
}

export function VehicleCard(props: VehicleCardProps) {
  const { make, model, year, licensePlate, status = 'active', fuelLevel, mileage } = props;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold">{make} {model}</h4>
          <StatusBadge variant={status === 'active' ? 'success' : 'inactive'} size="sm">
            {status}
          </StatusBadge>
        </div>
        <dl className="mt-2 text-sm text-content-muted space-y-1">
          {year != null && <><dt className="inline font-medium">Year: </dt><dd className="inline">{year}</dd></>}
          {licensePlate && <><dt className="inline font-medium">Plate: </dt><dd className="inline">{licensePlate}</dd></>}
          {fuelLevel != null && <><dt className="inline font-medium">Fuel: </dt><dd className="inline">{fuelLevel}%</dd></>}
          {mileage != null && <><dt className="inline font-medium">Mileage: </dt><dd className="inline">{mileage}</dd></>}
        </dl>
      </CardContent>
    </Card>
  );
}

export interface EntityCardStat {
  label: string;
  value: React.ReactNode;
}

export interface EntityCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  stats?: EntityCardStat[];
  actions?: React.ReactNode;
  className?: string;
}

export function EntityCard({ icon, title, description, stats, actions, className = '' }: EntityCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {icon != null && <div className="text-2xl shrink-0">{icon}</div>}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold">{title}</h4>
            {description != null && <p className="text-sm text-content-muted mt-0.5">{description}</p>}
            {stats != null && stats.length > 0 && (
              <dl className="mt-2 text-sm text-content-muted space-y-1">
                {stats.map((s, i) => (
                  <div key={i}>
                    <dt className="inline font-medium">{s.label}: </dt>
                    <dd className="inline">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {actions != null && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface CardGridProps {
  columns?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

const gridCols = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' };

export function CardGrid({ columns = 3, children, className = '' }: CardGridProps) {
  return <div className={cn('grid gap-4', gridCols[columns], className)}>{children}</div>;
}
