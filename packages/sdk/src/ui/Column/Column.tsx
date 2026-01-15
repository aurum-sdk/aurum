export const Column = ({
  align = 'center',
  gap = 8,
  justify = 'center',
  style,
  children,
}: {
  align?: 'center' | 'start' | 'end';
  gap?: number;
  justify?: 'center' | 'start' | 'end';
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        gap: `${gap}px`,
        justifyContent: justify,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
