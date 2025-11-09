/**
 * Create base mxGraphModel structure
 */

/**
 * Creates a basic mxGraphModel structure with root cells
 */
export function createBaseModel(
  pageWidth: number = 1100,
  pageHeight: number = 850
): string {
  return `<mxGraphModel dx="1394" dy="747" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageWidth}" pageHeight="${pageHeight}" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
  </root>
</mxGraphModel>`;
}
