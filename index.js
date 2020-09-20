const express = require('express')
const app = express()
const moment = require('moment')
const neatCsv = require('neat-csv');
const fs = require('fs')

// port to listen to
const port = 8080

// function that returns a csv file to as an array of objects
const getArrayFromCsv = async (path) => {
    const data = fs.readFileSync(path)
        .toString()
    return neatCsv(data)
}

app.listen(port, async () => {

// declaring result array
    let result =  []
    // getting array of objects for budget provided
    const budgetCsv = await getArrayFromCsv('./data/budget.csv')
    // getting array of objects for investment opportunities
    let investments = await getArrayFromCsv('./data/investments.csv')

    let yearlyBudget;
    let monthlyBudget;
    let budget = []

    // creating new budget array of objects from the csv file obtained
    for (let i = 0; i < budgetCsv.length; i++) {
        // if no sector is provided and time period is set to Year then a global variable 'yearlyBudget' will get set
        if ( budgetCsv[i].Sector === '' && budgetCsv[i]['Time Period'] === 'Year' ) {
            yearlyBudget = parseInt(budgetCsv[i].Amount)
        }// if no sector is provided and time period is set to Month then a global variable 'monthlyBudget' will get set
        else if ( budgetCsv[i].Sector === '' && budgetCsv[i]['Time Period'] === 'Month' ) {
            monthlyBudget = parseInt(budgetCsv[i].Amount)
        }// if not time period is provided then allowance type will get set to total for convenience
        else if (budgetCsv[i]['Time Period'] === '') {
            budget.push({
                id: parseInt(budgetCsv[i].ID),
                allowance: parseInt(budgetCsv[i].Amount),
                allowanceType: 'total',
                Sector: budgetCsv[i].Sector
            })
        } else {
            // 'budget array will contain all the budget rules that have a provided sector
            budget.push({
                id: parseInt(budgetCsv[i].ID),
                allowance: parseInt(budgetCsv[i].Amount),
                allowanceType: budgetCsv[i]['Time Period'],
                Sector: budgetCsv[i].Sector
            })
        }
    }

    // converting "MM/DD/YYYY" TO "DD/MM/YYYY" FORMAT
    for (let i = 0; i < investments.length; i++) {
        const dateBeforeFormatting = investments[i].Date
        // create an array of the date elements
        const dateArray = dateBeforeFormatting.split("/")
        // replace date and month with each other and push back to the array in desired format
        investments[i].Date = dateArray[1] + '/' + dateArray[0] + '/' + dateArray[2]
    }

    const arrayOfQuarterlyBudgetAllowances = budget.filter(x => x.allowanceType === 'Quarter')
    // console.log(arrayOfQuarterlyBudgetAllowances)

    // creating an object with key values for all sectors that have quarter limitations
    const quarterlyBudgets = {}
    for (let i = 0; i < arrayOfQuarterlyBudgetAllowances.length; i++) {
        quarterlyBudgets[`${arrayOfQuarterlyBudgetAllowances[i].Sector}`] = [
            { Quarter: 1, budget: arrayOfQuarterlyBudgetAllowances[i].allowance},
            { Quarter: 2, budget: arrayOfQuarterlyBudgetAllowances[i].allowance},
            { Quarter: 3, budget: arrayOfQuarterlyBudgetAllowances[i].allowance},
            { Quarter: 4, budget: arrayOfQuarterlyBudgetAllowances[i].allowance}
        ]
    }
    // console.log(quarterlyBudgets)

    // creating an object with key values for all sectors that have monthly limitations
    const arrayOfMonthlyBudgetAllowances = budget.filter(x => x.allowanceType === 'Month')
    const monthlyBudgets = {}

    for (let i = 0; i < arrayOfMonthlyBudgetAllowances.length; i++) {
        monthlyBudgets[`${arrayOfMonthlyBudgetAllowances[i].Sector}`] = [
            { Month: 1, budget: arrayOfMonthlyBudgetAllowances[i].allowance},
            { Month: 2, budget: arrayOfMonthlyBudgetAllowances[i].allowance},
            { Month: 3, budget: arrayOfMonthlyBudgetAllowances[i].allowance},
            { Month: 4, budget: arrayOfMonthlyBudgetAllowances[i].allowance},
            { Month: 5, budget: arrayOfMonthlyBudgetAllowances[i].allowance},
            { Month: 6, budget: arrayOfMonthlyBudgetAllowances[i].allowance},
            { Month: 7, budget: arrayOfMonthlyBudgetAllowances[i].allowance},
            { Month: 8, budget: arrayOfMonthlyBudgetAllowances[i].allowance},
            { Month: 9, budget: arrayOfMonthlyBudgetAllowances[i].allowance},
            { Month: 10, budget: arrayOfMonthlyBudgetAllowances[i].allowance},
            { Month: 12, budget: arrayOfMonthlyBudgetAllowances[i].allowance}
        ]
    }
    // console.log(monthlyBudgets)

    // creating an object with key values for all sectors that have quarter limitations

    // filtering budget array by year
    const arrayOfYearlyBudgetAllowances = budget.filter(x => x.allowanceType === 'Year')
    const dataByYears = []
    // once obtained a loop is run over to create object of Objects with key value pairs having key as sector name and values like year, sector, budget.
    for (let i = 0; i < arrayOfYearlyBudgetAllowances.length; i++) {
        for (let j = 0; j < investments.length; j++) {
            // check for current
            const currentYear = moment(investments[j].Date, "MM/DD/YYYY").year()

            // find index from dataByYears where year equals current year and
            // Sector equals to the current value of sector from arrayOfYearlyBudgetAllowances
            const index = dataByYears.findIndex(x => x.year === currentYear && x.Sector === arrayOfYearlyBudgetAllowances[i].Sector)
            if (index === -1) {
                dataByYears.push({
                    year: currentYear,
                    Sector: arrayOfYearlyBudgetAllowances[i].Sector,
                    budget: arrayOfYearlyBudgetAllowances[i].allowance
                })
            }
        }
    }

    // console.log(dataByYears)

    const YearlyBudgets = {}
    for (let i = 0; i < dataByYears.length; i++) {
        if (YearlyBudgets.hasOwnProperty(dataByYears[i].Sector)) {
            YearlyBudgets[`${dataByYears[i].Sector}`].push({
                year: dataByYears[i].year,
                budget: dataByYears[i].budget
            })
        } else {
            YearlyBudgets[`${dataByYears[i].Sector}`] = [{
                year: dataByYears[i].year,
                budget: dataByYears[i].budget
            }]
        }
    }

    // explicitly creating an array of objects which would keep a check of
    // how many investments are to be made in a specific month of a specific year
    const budgetByMonthsAndYear = []
    for (let i = 0; i < dataByYears.length; i++) {
        for (let j = 1; j <= 12; j++) {
            budgetByMonthsAndYear.push({
                month: j,
                year: dataByYears[i].year,
                monthlyLimit: 75,
                yearlyLimit:350
            })
        }
    }

    // Logic
    for (let i = 0; i < investments.length;) {
        const currentYear = moment(investments[i].Date, "MM/DD/YYYY").year()
        const currentMonth = moment(investments[i].Date, "MM/DD/YYYY").month() + 1
        const sector = investments[i].Sector

        // console.log(sector, 'line 150')
        const indexForAType = budget.findIndex(x => x.Sector === sector)
        if (indexForAType !== -1){
            const aType = budget[indexForAType].allowanceType
            const monthAndYearIndex = budgetByMonthsAndYear.findIndex(x => x.month === currentMonth && x.year === currentYear)

            // check if monthly/yearly allowed budget has not exceeded
            if (parseInt(investments[i]?.Amount) <= budgetByMonthsAndYear[monthAndYearIndex].monthlyLimit &&
                parseInt(investments[i]?.Amount) <= budgetByMonthsAndYear[monthAndYearIndex].yearlyLimit) {

                if (aType === 'Quarter') {

                    const quarterForCurrentInvestment = moment(new Date(investments[i].Date)).quarter()
                    const index = quarterlyBudgets[`${sector}`].findIndex(x => x.Quarter === quarterForCurrentInvestment)
                    // console.log('line 163 ', parseInt(investments[i].Amount), parseInt(quarterlyBudgets[`${sector}`][index].budget))
                    if (parseInt(investments[i].Amount) <= parseInt(quarterlyBudgets[`${sector}`][index].budget)) {
                        quarterlyBudgets[`${sector}`][index].budget -= parseInt(investments[i].Amount)
                    } else {
                        result.push(parseInt(investments[i].ID))
                        investments.splice(i, 1)
                        // console.log('quarter value deleted', 'line 169')
                    }

                } else if (aType === 'Year') {

                    const yearOfCurrentInvestment = moment(new Date(investments[i].Date)).year()

                    const index = YearlyBudgets[`${sector}`].findIndex(x => x.year === yearOfCurrentInvestment)
                    if (parseInt(investments[i].Amount) <= parseInt(YearlyBudgets[`${sector}`][index].budget)) {
                        YearlyBudgets[`${sector}`][index].budget -= parseInt(investments[i].Amount)
                    } else {
                        result.push(parseInt(investments[i].ID))
                        investments.splice(i, 1)
                        // console.log('yearly value deleted', 'line 186')
                    }

                } else if (aType === 'Month') {

                    const currentMonthOfInvestment = moment(new Date(investments[i].Date)).year()

                    const index = monthlyBudgets[`${sector}`].findIndex(x => x.Month === currentMonthOfInvestment)
                    if (parseInt(investments[i].Amount) <= parseInt(monthlyBudgets[`${sector}`][index].budget)) {
                        monthlyBudgets[`${sector}`].budget -= parseInt(investments[i].Amount)
                    } else {
                        result.push(parseInt(investments[i].ID))
                        investments.splice(i, 1)
                        // console.log('monthly value deleted', 'line 203')
                    }

                } else {

                    if (parseInt(investments[i].Amount) <= parseInt(budget[indexForAType].allowance)) {
                        budget[indexForAType].allowance -= parseInt(investments[i].budget)
                    } else {
                        result.push(parseInt(investments[i].ID))
                        investments.splice(i, 1)
                        // console.log('total value deleted', 'line 218')
                    }
                }

            }

        }
        const index = budgetByMonthsAndYear.findIndex(x => x.month === currentMonth && x.year === currentYear)
        // console.log(index, i, parseInt(investments[i]?.ID), 'line 225')

        // console.log(investments[i].Sector, parseInt(investments[i]?.Amount), budgetByMonthsAndYear[index].monthlyLimit, budgetByMonthsAndYear[index].yearlyLimit, 'line 227')
        // console.log(parseInt(investments[i]?.Amount) <= budgetByMonthsAndYear[index].monthlyLimit&&
        //     parseInt(investments[i]?.Amount) <= budgetByMonthsAndYear[index].yearlyLimit, 'line 229')
        if (parseInt(investments[i]?.Amount) <= budgetByMonthsAndYear[index].monthlyLimit &&
            parseInt(investments[i]?.Amount) <= budgetByMonthsAndYear[index].yearlyLimit) {
            budgetByMonthsAndYear[index].monthlyLimit -= parseInt(investments[i]?.Amount)
            budgetByMonthsAndYear[index].yearlyLimit -= parseInt(investments[i]?.Amount)
            // console.log('value true', 'line 234')
            i++;
        } else {
            result.push(parseInt(investments[i]?.ID))
            investments = investments.filter(obj => {
                return obj.ID !== investments[i]?.ID
            })
            // investments.splice(i - 1, 1)
            // console.log(investments, 'line 242')
        }
    }

    for (let i = 0; i < result.length; i++) {
        console.log(result[i])
    }
})