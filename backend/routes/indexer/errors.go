package indexer

import "fmt"

func PrintIndexerError(funcName string, errMsg string, args ...interface{}) {
	fmt.Println("Error indexing in "+funcName+": "+errMsg+" -- ", args)
}
