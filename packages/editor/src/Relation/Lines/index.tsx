import { Draw } from './Draw';
import { ParserField, getTypeName, compareParserFields } from 'graphql-js-tree';
import React, { useMemo } from 'react';
import { useTheme } from '@/state/containers';
import styled from '@emotion/styled';

const RelationsContainer = styled.svg`
  width: 100%;
  height: 100%;
  position: absolute;
  pointer-events: none;
  stroke: ${({ theme }) => theme.background.mainClosest};
  fill: transparent;
  stroke-width: 2px;
  transform: translatez(0);
  margin: -20px;
  overflow: visible;
`;

export interface RelationPath {
  htmlNode: HTMLDivElement;
  field: ParserField;
  index: number;
  connectingField: ParserField;
}
interface LinesProps {
  relations:
    | { to: RelationPath; from: RelationPath[]; fromLength: number }[]
    | undefined;
  selectedNode?: ParserField;
  showAllPaths?: boolean;
}

export const Lines: React.FC<LinesProps> = ({
  relations,
  selectedNode,
  showAllPaths,
}) => {
  const { theme } = useTheme();

  // For optimization purposes
  const relationContent = useMemo(() => {
    return relations
      ?.filter((r) => r.from)
      ?.map((r) => r.from.map((f) => f.field.name).join('.') + r.fromLength)
      .join(',');
  }, [relations]);

  const RelationSVGS = useMemo(() => {
    return relations?.map((r, index) => {
      const usedToIndexes: number[] = [];
      return r.from?.map((rf, relationNumber) => {
        if (!selectedNode) {
          return null;
        }
        const comparator = compareParserFields(selectedNode);
        const fromField = comparator(rf.field);
        const toField = comparator(r.to.field);
        let portNumber = rf.index;
        const relationType = rf.connectingField.type.fieldType;
        if (fromField) {
          portNumber =
            r.to.field.args?.findIndex(
              (fa, argIndex) =>
                getTypeName(fa.type.fieldType) === rf.field.name &&
                !usedToIndexes.includes(argIndex),
            ) || 0;
          portNumber = portNumber === -1 ? 0 : portNumber;
          usedToIndexes.push(portNumber);
        }
        if (!showAllPaths && !fromField && !toField) return null;
        return (
          <Draw
            relationType={relationType}
            active={fromField || toField}
            inverse={fromField}
            relationNumber={relationNumber}
            color={(theme.colors as any)[getTypeName(rf.field.type.fieldType)]}
            inActiveColor={
              (theme.colors as any)[getTypeName(rf.field.type.fieldType)]
            }
            key={`${index}-${rf.index}-${rf.field.name}`}
            from={rf.htmlNode}
            to={r.to.htmlNode}
            PortNumber={portNumber}
            maxIndex={r.from.length}
          />
        );
      });
    });
  }, [relationContent]);
  return <RelationsContainer>{RelationSVGS}</RelationsContainer>;
};
