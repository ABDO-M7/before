'use client'
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice';
import { exactPrice, formatDateMonth, isLogin, t } from '@/utils';
import { paymentTransactionApi } from '@/utils/api';
import { Table, Skeleton } from 'antd';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import UploadReceiptModal from '../PagesComponent/Transactions/UploadReceiptModal';
import { getIsLoggedIn } from '@/redux/reuducer/authSlice';

const TransactionsTable = () => {

    const CurrentLanguage = useSelector(CurrentLanguageData)
    const [IsUploadRecipt, setIsUploadRecipt] = useState(false)
    const [transactionId, setTransactionId] = useState('')
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [perPage, setPerPage] = useState(15);
    const isLogin = useSelector(getIsLoggedIn);


    const handleUploadReceipt = (id) => {
        setTransactionId(id)
        setIsUploadRecipt(true)
    }


    const PACKAGE_COLORS = {
        without:  { primary: "#00ABBF", dark: "#008A9A" },
        bronze:   { primary: "#CD7F32", dark: "#8D5524" },
        silver:   { primary: "#B8C2CC", dark: "#5f666c" },
        gold:     { primary: "#D4AF37", dark: "#AA771C" },
        platinum: { primary: "#7B8FA1", dark: "#425B70" },
        diamond:  { primary: "#00B4D8", dark: "#0077B6" },
    };

    const STATUS_LABELS = {
        succeed:       t('succeed'),
        failed:        t('failed'),
        pending:       t('pending'),
        'under review': t('underReview'),
        rejected:      t('rejected'),
    };

    const columns = [
        {
            title: t('id'),
            dataIndex: 'id',
            key: 'id',
            align: 'center',
        },
        {
            title: t('packageName'),
            key: 'package_name',
            align: 'center',
            render: (_, record) => {
                const pkg = PACKAGE_COLORS[record?.package?.color];
                return (
                    <span style={pkg ? {
                        background: `linear-gradient(135deg, ${pkg.primary}, ${pkg.dark})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 600,
                    } : undefined}>
                        {record?.package?.name || '-'}
                    </span>
                );
            },
        },
        {
            title: t('paymentMethod'),
            dataIndex: 'payment_gateway',
            key: 'payment_gateway',
            align: 'center',
        },
        {
            title: t('transactionId'),
            dataIndex: 'order_id',
            key: 'order_id',
            align: 'center',
        },
        {
            title: t('date'),
            dataIndex: 'created_at',
            key: 'created_at',
            align: 'center',
            render: (text) => {
                return (
                    <span>{formatDateMonth(text)}</span>
                )
            }
        },
        {
            title: t('price'),
            dataIndex: 'amount',
            key: 'amount',
            align: 'center',
            render: (text) => exactPrice(text),
        },
        {
            title: t('status'),
            dataIndex: 'payment_status',
            key: 'payment_status',
            align: 'center',
            render: (text, record) => {
                let statusClassName = '';

                switch (text) {
                    case 'succeed':
                        statusClassName = 'success_status';
                        break;
                    case 'failed':
                        statusClassName = 'failed_status';
                        break;
                    case 'pending':
                        statusClassName = 'pending_status';
                        break;
                    case 'under review':
                        statusClassName = 'under_review_status';
                        break;
                    case 'rejected':
                        statusClassName = 'rejected_status';
                        break;
                    default:
                        statusClassName = '';
                        break;
                }

                const label = STATUS_LABELS[text] || text;

                return (
                    <div>
                        {record.payment_gateway === 'BankTransfer' && text === 'pending' ? (
                            <button
                                className="upload_receipt_button"
                                onClick={() => handleUploadReceipt(record.id)}
                            >
                                {t('uploadReceipt')}
                            </button>
                        ) : (
                            <span className={statusClassName}>{label}</span>
                        )}
                    </div>
                );
            },
        },
    ];

    const skeletonColumns = columns.map((col) => ({
        ...col,
        render: () => (
            <Skeleton.Input active size="default" style={{ width: '50%' }} />
        ),
    }));

        const fetchTransactions = async (page) => {
        try {
            setIsLoading(true);
            const res = await paymentTransactionApi.transaction({ page });
            if (res?.data?.error === false) {
                setData(res?.data?.data?.data);
                setCurrentPage(res?.data?.data?.current_page);
                setPerPage(res?.data?.data?.per_page);
                setTotalItems(res?.data?.data?.total);
            } else {
                console.error(res?.data?.message);
            }
        } catch (error) {
            console.log(error);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLogin) {
            fetchTransactions(currentPage)
        }
    }, [currentPage, isLogin]);

  
    return (
        <>
            {isLoading ? (
                <Table
                    columns={skeletonColumns}
                    dataSource={Array.from({ length: 10 }, (_, index) => ({ key: index }))}
                    className="notif_table"
                    pagination={false}
                />
            ) : (
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    className="notif_table"
                    scroll={{ y: 600, x: 'max-content' }} // ✅ Enable virtualization for better performance
                    pagination={
                        totalItems > perPage
                            ? {
                                current: currentPage,
                                pageSize: perPage,
                                total: totalItems,
                                showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total}`,
                                onChange: (page) => setCurrentPage(page),
                                showSizeChanger: false,
                                disabled: isLoading,
                            }
                            : false
                    }
                />
            )}
            <UploadReceiptModal IsUploadRecipt={IsUploadRecipt} setIsUploadRecipt={setIsUploadRecipt} transactionId={transactionId} setData={setData} />
        </>
    );
};

export default TransactionsTable;
