export const Row = ({
  align = 'center',
  justify = 'center',
  children,
  gap = 8,
  style,
  ...props
}: {
  align?: 'center' | 'start' | 'end' | 'baseline';
  justify?: 'center' | 'start' | 'end' | 'space-between';
  gap?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: align,
        justifyContent: justify,
        gap: `${gap}px`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
