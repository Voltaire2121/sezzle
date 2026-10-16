import { CalculatorContainer } from '../containers/Calculator/CalculatorContainer';

export function CalculatorPage() {
  return (
    <main className="flex h-dvh w-full items-stretch justify-center bg-black lg:items-center lg:bg-[#0b0b0b] lg:p-8">
      <CalculatorContainer />
    </main>
  );
}
