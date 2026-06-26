import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { Button } from "../Button/Button";

import "./WidgetCard.css";

export interface WidgetCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Title shown in the edit-mode header. */
  title: string;
  /** Whether the dashboard is in edit mode (shows the header + controls). */
  editing: boolean;
  /** Show the configure (gear) action in the header. */
  hasConfig?: boolean;
  /**
   * The widget's rendered content. Kept as a dedicated prop — not `children` —
   * because react-grid-layout injects the resize handle into `children`, which
   * we render separately at the card root.
   */
  body: ReactNode;
  onConfigure?: () => void;
  onRemove?: () => void;
}

// Keep header button clicks from initiating a grid drag.
const stopDrag = (e: React.MouseEvent) => e.stopPropagation();

/**
 * The shared frame every widget renders inside, giving all widgets a consistent
 * surface, border, and edit-mode header (with configure/remove actions).
 *
 * This is the direct child of <GridLayout>, so react-grid-layout clones it to
 * inject `ref`, `className`, `style`, drag handlers, and the resize handle
 * (appended to `children`). We therefore forward the ref, spread the injected
 * props (`...rest`) onto the root element, and render the injected `children`
 * at the root so the handle anchors to the card corner.
 */
export const WidgetCard = forwardRef<HTMLDivElement, WidgetCardProps>(
  function WidgetCard(
    {
      title,
      editing,
      hasConfig,
      body,
      onConfigure,
      onRemove,
      className,
      children,
      ...rest
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={`widget-card ${className ?? ""}`.trim()}
        {...rest}
      >
        {editing && (
          <div className="widget-header">
            <span className="widget-title">{title}</span>
            <div className="widget-actions">
              {hasConfig && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  title="Configure"
                  onMouseDown={stopDrag}
                  onClick={onConfigure}
                >
                  ⚙
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                title="Remove"
                onMouseDown={stopDrag}
                onClick={onRemove}
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        <div className="widget-body">{body}</div>

        {/* react-grid-layout injects the resize handle here. */}
        {children}
      </div>
    );
  }
);
