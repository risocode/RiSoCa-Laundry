import Image from 'next/image';
import { cn } from '@/lib/utils';

export const PesoCoinIcon = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props}>
    <Image
      src="https://cdn-icons-png.flaticon.com/512/32/32724.png"
      alt="Peso Coin"
      width={48}
      height={48}
      className={cn(props.className)}
    />
  </div>
);
