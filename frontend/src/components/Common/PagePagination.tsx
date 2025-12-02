import { Pagination } from 'antd';
import { PaginationResponse } from '@/types/common.types';

interface PagePaginationProps {
  pagination: PaginationResponse;
  onChange: (pageNo: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: string[];
}

export function PagePagination({
  pagination,
  onChange,
  showSizeChanger = true,
  pageSizeOptions = ['10', '20', '50', '100'],
}: PagePaginationProps) {
  return (
    <Pagination
      current={pagination.pageNo}
      pageSize={pagination.pageSize}
      total={pagination.total}
      showSizeChanger={showSizeChanger}
      pageSizeOptions={pageSizeOptions}
      showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
      onChange={onChange}
      onShowSizeChange={onChange}
    />
  );
}

