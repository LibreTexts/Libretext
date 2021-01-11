import React, {useEffect} from 'react';
import TablePagination from '@material-ui/core/TablePagination';

export default function RevisionLog() {
    const user = document.getElementById('usernameHolder').textContent;
    const [fetchResult, setFetchResult] = React.useState([]);
    
    useEffect(() => {
        async function fetchData() {
            let response = await fetch('https://api.libretexts.org/bot/Logs/Users/admin.csv');
            response = await response.text()
            response = response.split(',')
            setFetchResult(response);
        }
        
        fetchData();
    }, [])
    
    const [page, setPage] = React.useState(2);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    let result = [...fetchResult].reverse();
    const firstIndex = rowsPerPage * page;
    const lastIndex = firstIndex + rowsPerPage;
    const totalCount = fetchResult.length;
    result = result.slice(firstIndex, lastIndex);
    
    result = result.map((item, index) => <div key={index}>{item}</div>);
    
    return <div id="Revisions">
        <div className="topPanel">
            <div className="Center">
                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onChangePage={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onChangeRowsPerPage={handleChangeRowsPerPage}
                />
                {result}
                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onChangePage={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onChangeRowsPerPage={handleChangeRowsPerPage}
                />
            </div>
        </div>
    </div>
}
